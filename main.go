package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/JozefPlata/node-nebula/pkg/npm"
	"io"
	"log"
	"net/http"
	"sort"
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

func fetchPackageInfo(packageName string) (npm.Package, error) {
	url := fmt.Sprintf("https://registry.npmjs.org/%s", packageName)
	resp, err := http.Get(url)
	if err != nil {
		return npm.Package{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return npm.Package{}, errors.New(resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return npm.Package{}, err
	}

	////fmt.Println(string(body))
	//var prettyJSON bytes.Buffer
	//if err := json.Indent(&prettyJSON, body, "", "  "); err != nil {
	//	return npm.PackageInfo{}, err
	//}

	//_ = os.WriteFile("vue_shared.json", prettyJSON.Bytes(), 0644)

	var pkgInfo *npm.Package
	if err = json.Unmarshal(body, &pkgInfo); err != nil {
		return npm.Package{}, err
	}

	return *pkgInfo, nil
}

func main() {
	info, err := fetchPackageInfo("@vue/shared")
	if err != nil {
		log.Fatal(err)
	}

	var pkgVersions []npm.PackageVersion
	for _, v := range info.Versions {
		parsed, _ := npm.ParseVersion(v.Version)
		pkgVersions = append(pkgVersions, parsed)
	}
	sort.Sort(npm.ByVersion(pkgVersions))

	for _, ver := range pkgVersions {
		fmt.Println(ver)
	}
	////fmt.Println(info.Version)
	//for k, v := range info.Versions {
	//	fmt.Println(k, "\t:", len(v.Dependencies))
	//}
}
