package npm

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"
)

type Package struct {
	Name     string                 `json:"name"`
	Version  string                 `json:"version"`
	Versions map[string]PackageInfo `json:"versions"`
	DistTags map[string]string      `json:"dist-tags"`
}

type PackageVersion struct {
	Prefix  string
	Major   int
	Minor   int
	Patch   int
	Verbose string
}

type PackageInfo struct {
	Name                 string            `json:"name"`
	Version              string            `json:"version"`
	Dependencies         map[string]string `json:"dependencies"`
	ResolvedDependencies map[string]PackageInfo
}

func (pi *PackageInfo) PrintResults(ident int, filter string) {
	for dep, info := range pi.ResolvedDependencies {
		if filter != "" {
			if filter == dep {
				fmt.Printf("%s%s -> %s\n", strings.Repeat("   ", ident), dep, info.Version)
				info.PrintResults(ident+1, filter)
			}
		} else {
			//fmt.Printf("%s%s -> %s\n", strings.Repeat("   ", ident), dep, info.Version)
			//info.PrintResults(ident+1, "")
		}
	}
}

func (pi *PackageInfo) SaveAsJson(filter string) error {
	jsonData, err := json.MarshalIndent(pi.ResolvedDependencies, "", "  ")
	if err != nil {
		msg := fmt.Sprintf("Error marshalling to JSON: %s", err)
		return errors.New(msg)
	}

	file, err := os.Create(fmt.Sprintf("%s.json", filter))
	if err != nil {
		msg := fmt.Sprintf("Error creating file: %s", err)
		return errors.New(msg)
	}
	defer file.Close()

	_, err = file.Write(jsonData)
	if err != nil {
		msg := fmt.Sprintf("Error writing to file: %s", err)
		return errors.New(msg)
	}

	return nil
}
