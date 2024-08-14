package npm

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
)

const npmRegistry = "https://registry.npmjs.org"

func GetPackageInfo(packageName, version string, verbose bool) (PackageInfo, error) {
	info, err := fetchPackageInfo(packageName, version, verbose)
	if err != nil {
		return PackageInfo{}, err
	}

	return info, nil
}

func fetchPackageInfo(packageName, version string, verbose bool) (PackageInfo, error) {
	info, err := fetchResolvedInfo(packageName, version)
	if err != nil {
		return PackageInfo{}, err
	}

	//url := fmt.Sprintf("%s/%s", npmRegistry, packageName)
	//resp, err := http.Get(url)
	//if err != nil {
	//	return PackageInfo{}, err
	//}
	//defer resp.Body.Close()
	//
	//if resp.StatusCode != http.StatusOK {
	//	return PackageInfo{}, errors.New(resp.Status)
	//}
	//
	//body, err := io.ReadAll(resp.Body)
	//if err != nil {
	//	return PackageInfo{}, err
	//}
	//
	//var pkg *Package
	//if err = json.Unmarshal(body, &pkg); err != nil {
	//	return PackageInfo{}, err
	//}
	//
	//if version == "latest" {
	//	version = pkg.DistTags["latest"]
	//}

	//pkgVersion := pkg.Versions[version]
	//info.dependencies()
	var wg sync.WaitGroup
	var mu sync.Mutex

	//for dep, v := range pkgVersion.Dependencies {
	//	wg.Add(1)
	//	go func() {
	//		defer wg.Done()
	//		fetchResolvedInfo()
	//		ver, e := resolveVersion(v)
	//		if e != nil {
	//			pkgVersion.Dependencies[dep] = e.Error()
	//		} else {
	//			pkgVersion.Dependencies[dep] = ver
	//		}
	//	}()
	//}
	//wg.Wait()

	info.ResolvedDependencies = make(map[string]PackageInfo)
	visited := make(map[string]bool)

	for dep, v := range info.Dependencies {
		wg.Add(1)
		go func(dep, v string) {
			defer wg.Done()
			if verbose {
				fmt.Printf("%s -> %s\n", dep, v)
			}
			res, _ := resolveDependencies(dep, v, verbose, 1, visited, &mu)
			mu.Lock()
			info.ResolvedDependencies[dep] = res
			mu.Unlock()
		}(dep, v)
	}

	wg.Wait()

	return info, nil
}

func fetchResolvedInfo(packageName, version string) (PackageInfo, error) {
	url := fmt.Sprintf("%s/%s", npmRegistry, packageName)
	resp, err := http.Get(url)
	if err != nil {
		return PackageInfo{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return PackageInfo{}, errors.New(resp.Status)
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return PackageInfo{}, err
	}

	var pkg *Package
	if err = json.Unmarshal(body, &pkg); err != nil {
		return PackageInfo{}, err
	}

	if version == "latest" {
		version = pkg.DistTags["latest"]
	}

	info, err := pkg.ResolveVersion(version)
	if err != nil {
		return PackageInfo{}, err
	}

	return info, nil
}

func resolveDependencies(name string, version string, verbose bool, identLevel int, visited map[string]bool, mu *sync.Mutex) (PackageInfo, error) {
	info, err := fetchResolvedInfo(name, version)
	if err != nil {
		return PackageInfo{}, err
	}

	//url := fmt.Sprintf("%s/%s/%s", npmRegistry, name, version)
	//resp, err := http.Get(url)
	//if err != nil {
	//	return PackageInfo{}, err
	//}
	//defer resp.Body.Close()
	//
	//if resp.StatusCode != http.StatusOK {
	//	return PackageInfo{}, errors.New(resp.Status)
	//}
	//
	//body, err := io.ReadAll(resp.Body)
	//if err != nil {
	//	return PackageInfo{}, err
	//}
	//
	//var info *PackageInfo
	//if err = json.Unmarshal(body, &info); err != nil {
	//	return PackageInfo{}, err
	//}

	//info.dependencies()
	info.ResolvedDependencies = make(map[string]PackageInfo)
	var wg sync.WaitGroup

	for dep, v := range info.Dependencies {
		wg.Add(1)
		go func(dep, v string) {
			defer wg.Done()
			if verbose {
				ident := strings.Repeat("   ", identLevel)
				fmt.Printf("%s%s -> %s\n", ident, dep, v)
			}
			res, _ := resolveDependencies(dep, v, verbose, identLevel+1, visited, mu)
			mu.Lock()
			info.ResolvedDependencies[dep] = res
			mu.Unlock()
		}(dep, v)
	}

	wg.Wait()

	return info, nil
}
