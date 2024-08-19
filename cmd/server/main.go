package main

import (
	"fmt"
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

	e.GET("/", func(c echo.Context) error {
		return c.Render(http.StatusOK, "index", nil)
	})

	e.POST("/get-library", func(c echo.Context) error {
		lib := c.FormValue("library-name")
		info, err := npm.GetPackageInfo(lib, "latest")
		if err != nil {
			fmt.Println(err)
			return err
		}

		resolved := info.ToResolvedPackage()

		return c.JSON(http.StatusOK, resolved)
	})

	e.Logger.Fatal(e.Start(":8080"))
}
