package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/JozefPlata/node-nebula/pkg/npm"
	"io"
	"log"
	"net/http"
	"os"
)

//type PackageInfo struct {
//	Name     string                    `json:"name"`
//	Version  string                    `json:"version"`
//	Versions map[string]PackageVersion `json:"versions"`
//	DistTags map[string]string         `json:"dist-tags"`
//}
//
//type PackageVersion struct {
//	Name         string            `json:"name"`
//	Version      string            `json:"version"`
//	Dependencies map[string]string `json:"dependencies"`
//}

func fetchPackageInfo(packageName string) (npm.PackageInfo, error) {
	url := fmt.Sprintf("https://registry.npmjs.org/%s", packageName)
	resp, err := http.Get(url)
	if err != nil {
		return npm.PackageInfo{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return npm.PackageInfo{}, errors.New(resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return npm.PackageInfo{}, err
	}

	////fmt.Println(string(body))
	var prettyJSON bytes.Buffer
	if err := json.Indent(&prettyJSON, body, "", "  "); err != nil {
		return npm.PackageInfo{}, err
	}

	_ = os.WriteFile(fmt.Sprintf("%s.json", packageName), prettyJSON.Bytes(), 0644)

	var pkgInfo *npm.PackageInfo
	if err = json.Unmarshal(body, &pkgInfo); err != nil {
		return npm.PackageInfo{}, err
	}

	return *pkgInfo, nil
}

func main() {
	info, err := fetchPackageInfo("next")
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(info.Name)
	////fmt.Println(info.Version)
	//for k, v := range info.Versions {
	//	fmt.Println(k, "\t:", len(v.Dependencies))
	//}
}
