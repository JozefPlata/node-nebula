package main

import (
	"fmt"
	"github.com/JozefPlata/node-nebula/pkg/npm"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"html/template"
	"io"
	"net/http"
	"sync"
	"time"
)

type Templates struct {
	templates *template.Template
}

func (t Templates) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
	return t.templates.ExecuteTemplate(w, name, data)
}

func newTemplate() *Templates {
	return &Templates{
		templates: template.Must(template.ParseGlob("views/*.gohtml")),
	}
}

type App struct {
	Version string
}

func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Static("/bjs", "bjs")
	e.Renderer = newTemplate()
	progressChannels := make(map[string]*npm.ProgressChannel)
	var mu sync.Mutex

	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			mu.Lock()
			for sesId, progress := range progressChannels {
				select {
				case <-progress.Done:
					close(progress.Package)
					delete(progressChannels, sesId)
				default:
					// Session still active
				}
			}
			mu.Unlock()
		}
	}()

	//
	e.GET("/", func(c echo.Context) error {
		sesId := uuid.New().String()

		mu.Lock()
		progressChannels[sesId] = &npm.ProgressChannel{
			Package: make(chan string),
			Done:    make(chan bool),
		}
		mu.Unlock()

		url := fmt.Sprintf("/%s", sesId)
		c.Response().Header().Add("HX-Redirect", url)
		_ = c.Redirect(http.StatusFound, url)

		return nil
	})

	//
	e.GET("/:sesId", func(c echo.Context) error {
		sesId := c.Param("sesId")

		mu.Lock()
		_, ok := progressChannels[sesId]
		mu.Unlock()

		if !ok {
			c.Response().Header().Add("HX-Redirect", "/")
			_ = c.Redirect(http.StatusTemporaryRedirect, "/")
			return nil
		}

		app := App{Version: "0.0.1"}
		return c.Render(http.StatusOK, "index", app)
	})

	// HTMX endpoint
	e.POST("/get-lib/:sesId", func(c echo.Context) error {
		sesId := c.Param("sesId")

		mu.Lock()
		progress, ok := progressChannels[sesId]
		mu.Unlock()

		if !ok {
			return c.String(http.StatusNotFound, "Session not found")
		}

		go func() {
			for done := range progress.Done {
				_ = done
			}
		}()

		lib := c.FormValue("lib-name")
		info, err := npm.GetPackageInfo(lib, "latest", *progress)
		if err != nil {
			return c.String(http.StatusInternalServerError, "Error processing request")
		}

		resolved := info.ToResolvedPackage()
		return c.JSON(http.StatusOK, resolved)
	})

	// SSE endpoint
	e.GET("/progress/:sesId", func(c echo.Context) error {
		sesId := c.Param("sesId")

		mu.Lock()
		progress, exists := progressChannels[sesId]
		mu.Unlock()

		if !exists {
			return c.String(http.StatusNotFound, "Session not found")
		}

		c.Response().Header().Set(echo.HeaderContentType, "text/event-stream")
		c.Response().Header().Set(echo.HeaderCacheControl, "no-cache")
		c.Response().Header().Set(echo.HeaderConnection, "keep-alive")

		for msg := range progress.Package {
			_, _ = fmt.Fprintf(c.Response(), "data: %s\n\n", msg)
			c.Response().Flush()
		}

		close(progress.Done)
		close(progress.Package)

		return nil
	})

	//
	e.Logger.Fatal(e.Start(":8080"))
}
