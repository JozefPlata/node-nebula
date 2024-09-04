package npm

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"sync"
)

func GetPackageInfo(packageName, version string, progress ProgressChannel) (PackageInfo, error) {
	info, err := fetchPackageInfo(packageName, version, progress)
	if err != nil {
		return PackageInfo{}, err
	}

	return info, nil
}

func fetchPackageInfo(packageName, version string, progress ProgressChannel) (PackageInfo, error) {
	info, err := fetchResolvedInfo(packageName, version)
	if err != nil {
		return PackageInfo{}, err
	}

	var wg sync.WaitGroup
	var mu sync.Mutex
	info.ResolvedDependencies = make(map[string]PackageInfo)

	for dep := range info.Dependencies {
		progress.Package <- fmt.Sprintf("Fetching: %s", dep)
	}

	depPath := make([]string, 0)

	for dep, ver := range info.Dependencies {
		wg.Add(1)
		//time.Sleep(time.Millisecond * 200)
		go func(dep, ver string) {
			defer wg.Done()
			res, err := resolveDependencies(dep, ver, depPath, &mu)
			if err != nil {
				progress.Package <- fmt.Sprintf("Error resolving dependency package %s %s: %s", dep, ver, err)
				return
			}
			mu.Lock()
			info.ResolvedDependencies[dep] = res
			mu.Unlock()
			progress.Package <- fmt.Sprintf("DONE: %s", dep)
			progress.Done <- true
		}(dep, ver)
	}

	wg.Wait()

	return info, nil
}

func fetchResolvedInfo(packageName, version string) (PackageInfo, error) {
	url := fmt.Sprintf("%s/%s", npmRegistry, packageName)
	resp, err := http.Get(url)
	defer resp.Body.Close()
	if err != nil {
		return PackageInfo{}, err
	}

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
