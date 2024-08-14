package main

import (
	"fmt"
	"github.com/JozefPlata/node-nebula/pkg/npm"
	"github.com/urfave/cli/v2"
	"log"
	"os"
	"time"
)

func main() {
	app := &cli.App{
		Name:  "Dependency Getter",
		Usage: "Get dependencies for a library from the npm.com",
		Flags: []cli.Flag{
			&cli.StringFlag{
				Name:  "lib",
				Value: "",
				Usage: "The name of the library to get dependencies for",
			},
			&cli.StringFlag{
				Name:  "ver",
				Value: "",
				Usage: "Version of the library, overrides 'latest'",
			},
			&cli.BoolFlag{
				Name:  "verbose",
				Value: false,
				Usage: "Verbose output",
			},
			&cli.StringFlag{
				Name:  "save",
				Value: "",
				Usage: "Save the dependencies to this file",
			},
			&cli.StringFlag{
				Name:  "filter",
				Value: "",
				Usage: "Filter by dependency library name",
			},
		},
		Action: func(c *cli.Context) error {
			lib := c.String("lib")
			if lib == "" {
				return fmt.Errorf("lib flag is required")
			}
			version := c.String("ver")
			verbose := c.Bool("verbose")
			save := c.String("save")
			filter := c.String("filter")

			if lib == "" {
				return nil
			}

			if version == "" {
				version = "latest"
			}

			//save := c.String("save")

			start := time.Now()
			info, err := npm.GetPackageInfo(lib, version, verbose)
			if err != nil {
				return err
			}
			elapsed := time.Since(start)
			info.PrintResults(0, filter)
			if save != "" {
				err := info.SaveAsJson(save)
				if err != nil {
					return err
				}
			}
			fmt.Printf("Time total: %.3fs\n", elapsed.Seconds())

			return nil
		},
	}

	if err := app.Run(os.Args); err != nil {
		log.Fatal(err)
	}
}
