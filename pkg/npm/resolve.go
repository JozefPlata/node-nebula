package npm

import (
	"errors"
	"fmt"
	"sort"
	"strings"
	"sync"
)

const npmRegistry = "https://registry.npmjs.org"

func resolveDependencies(targetLib string, libVer string, path []string, mu *sync.Mutex) (PackageInfo, error) {
	mu.Lock()
	for _, lib := range path {
		if lib == targetLib {
			msg := fmt.Sprintf("Circular dependency found: %s -> %s\n", strings.Join(path, " -> "), targetLib)
			mu.Unlock()
			return PackageInfo{}, errors.New(msg)
		}
	}

	path = append(path, targetLib)
	mu.Unlock()

	info, err := fetchResolvedInfo(targetLib, libVer)
	if err != nil {
		return PackageInfo{}, err
	}

	info.ResolvedDependencies = make(map[string]PackageInfo)
	var wg sync.WaitGroup

	for dep, ver := range info.Dependencies {
		wg.Add(1)
		go func(dep, ver string) {
			defer wg.Done()

			res, err := resolveDependencies(dep, ver, path, mu)
			if err != nil {
				//fmt.Printf("Error resolving dependency package %s %s: %s\n", dep, ver, err)
				return
			}

			mu.Lock()
			info.ResolvedDependencies[dep] = res
			mu.Unlock()
		}(dep, ver)
	}

	wg.Wait()

	return info, nil
}

func (p Package) ResolveVersion(version string) (PackageInfo, error) {
	pkgVersion, err := parseVersion(version)
	if err != nil {
		return PackageInfo{}, err
	}

	if pkgVersion.Prefix == "" {
		info := p.Versions[pkgVersion.Verbose]
		if info.Name == "" {
			msg := fmt.Sprintf("PackageInfo.ResolveVersion() - package '%s' version '%s' does not exist", p.Name, pkgVersion.Verbose)
			return PackageInfo{}, errors.New(msg)
		}
		return info, nil
	}

	if pkgVersion.Prefix == "~" || pkgVersion.Prefix == "^" {
		var pkgVersions []PackageVersion
		for _, v := range p.Versions {
			parsed, err := parseVersion(v.Version)
			if err != nil {
				return PackageInfo{}, err
			}
			pkgVersions = append(pkgVersions, parsed)
		}
		sort.Sort(ByVersion(pkgVersions))

		verbose := ""
		topPkg := PackageVersion{}
		found := PackageVersion{}
		switch pkgVersion.Prefix {
		case "~":
			topPkg = PackageVersion{
				Major: pkgVersion.Major,
				Minor: pkgVersion.Minor + 1,
				Patch: 0,
			}

			for i, v := range pkgVersions {
				if v.Major <= topPkg.Major {
					if v.Minor < topPkg.Minor {
						found = pkgVersions[i]
						continue
					}
					continue
				}
				break
			}
		case "^":
			topPkg = PackageVersion{
				Major: pkgVersion.Major + 1,
				Minor: 0,
				Patch: 0,
			}

			for i, v := range pkgVersions {
				if v.Major < topPkg.Major {
					found = pkgVersions[i]
					continue
				}
				break
			}
		}

		verbose = found.Verbose
		if verbose == "" {
			msg := fmt.Sprintf("PackageInfo.ResolveVersion() - package '%s' resolved to '%s'", p.Name, verbose)
			return PackageInfo{}, errors.New(msg)
		}
		info := p.Versions[verbose]
		if info.Name == "" {
			msg := fmt.Sprintf("PackageInfo.ResolveVersion() - '%s' version not found", verbose)
			return PackageInfo{}, errors.New(msg)
		}
		return info, nil
	}

	return PackageInfo{}, errors.New("PackageInfo.ResolveVersion() - unsupported-version")
}
