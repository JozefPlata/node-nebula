package main

import (
	"github.com/JozefPlata/node-nebula/pkg/npm"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"html/template"
	"io"
	"net/http"
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

func main() {
	e := echo.New()
	e.Use(middleware.Logger())
	e.Static("/bjs", "bjs")
	e.Renderer = newTemplate()
	progress := make(chan string)
	//var upgrader = websocket.Upgrader{}

	e.GET("/", func(c echo.Context) error {
		return c.Render(http.StatusOK, "index", nil)
	})

	go func() {
		for msg := range progress {
			_ = msg
		}
	}()

	e.POST("/get-library", func(c echo.Context) error {
		lib := c.FormValue("library-name")

		info, _ := npm.GetPackageInfo(lib, "latest", progress)

		resolved := info.ToResolvedPackage()

		return c.JSON(http.StatusOK, resolved)
	})

	//e.GET("/ws/progress", func(c echo.Context) error {
	//	ws, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	//	if err != nil {
	//		return err
	//	}
	//	defer ws.Close()
	//
	//	progress := make(chan string)
	//
	//	go func() {
	//		for msg := range progress {
	//			if err := ws.WriteMessage(websocket.TextMessage, []byte(msg)); err != nil {
	//				return
	//			}
	//		}
	//	}()
	//
	//	lib := c.FormValue("library-name")
	//	if lib == "" {
	//		return errors.New("no library name")
	//	}
	//	info, _ := npm.GetPackageInfo(lib, "latest", progress)
	//	close(progress)
	//
	//	resolved := info.ToResolvedPackage()
	//	data, _ := json.Marshal(resolved)
	//	ws.WriteMessage(websocket.TextMessage, data)
	//	return nil
	//})

	e.Logger.Fatal(e.Start(":8080"))
}
