package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/JozefPlata/node-nebula/pkg/npm"
	"github.com/urfave/cli/v2"
	"io"
	"log"
	"net/http"
	"os"
)

func main() {
	app := &cli.App{
		Name:  "Versions Getter",
		Usage: "Use to preview available versions",
		Flags: []cli.Flag{
			&cli.StringFlag{
				Name:    "lib",
				Value:   "",
				Aliases: []string{"l"},
				Usage:   "The name of the library to browse",
			},
			&cli.StringFlag{
				Name:    "ver",
				Value:   "",
				Aliases: []string{"v"},
				Usage:   "Full npm-style version of the package",
			},
		},
		Action: func(c *cli.Context) error {
			lib := c.String("lib")
			if lib == "" {
				return errors.New("library name is required")
			}
			ver := c.String("ver")
			if ver == "" {
				return errors.New("version is required")
			}

			url := fmt.Sprintf("%s/%s", "https://registry.npmjs.org", lib)
			resp, err := http.Get(url)
			if err != nil {
				return err
			}
			defer resp.Body.Close()

			if resp.StatusCode != http.StatusOK {
				errors.New(resp.Status)
			}
			body, err := io.ReadAll(resp.Body)
			if err != nil {
				return err
			}

			//var prettyJSON bytes.Buffer
			//if err = json.Indent(&prettyJSON, body, "", "  "); err != nil {
			//	return err
			//}
			//
			//_ = os.WriteFile(out, prettyJSON.Bytes(), 0644)

			var pkg npm.Package
			if err = json.Unmarshal(body, &pkg); err != nil {
				return err
			}

			info, err := pkg.ResolveVersion(ver)
			if err != nil {
				return err
			}

			fmt.Printf("Resolved to: %s\n", info)

			return nil
		},
	}

	if err := app.Run(os.Args); err != nil {
		log.Fatal(err)
	}
}
