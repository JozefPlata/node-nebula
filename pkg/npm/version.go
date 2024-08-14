package npm

import (
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"
)

func (p Package) ResolveVersion(version string) (PackageInfo, error) {
	pkgVersion, err := parseVersion(version)
	if err != nil {
		return PackageInfo{}, err
	}

	if pkgVersion.Prefix == "" {
		ver := fmt.Sprintf("%d.%d.%d", pkgVersion.Major, pkgVersion.Minor, pkgVersion.Patch)
		info := p.Versions[ver]
		if info.Name == "" {
			msg := fmt.Sprintf("PackageInfo.ResolveVersion() - package '%s' version '%s' does not exist", p.Name, version)
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

func parseVersion(version string) (PackageVersion, error) {
	prefix := ""
	switch version[:1] {
	case "~", "^":
		prefix = version[:1]
	case "0", "1", "2", "3", "4", "5", "6", "7", "8", "9":
		prefix = ""
	default:
		return PackageVersion{}, errors.New("unsupported-version-prefix")
	}

	s := strings.Split(version, ".")
	if len(s) != 3 {
		return PackageVersion{}, errors.New("unknown-or-unsupported-version")
	}

	mjr, err := resolveMajorNumber(s[0])
	if err != nil {
		return PackageVersion{}, err
	}
	mnr, err := resolveMinorNumber(s[1])
	if err != nil {
		return PackageVersion{}, err
	}
	ptc, err := resolvePatchNumber(s[2])
	if err != nil {
		return PackageVersion{}, err
	}

	return PackageVersion{
		Prefix:  prefix,
		Major:   mjr,
		Minor:   mnr,
		Patch:   ptc,
		Verbose: fmt.Sprintf("%d.%d.%s", mjr, mnr, s[2]),
	}, nil
}

func resolveMajorNumber(version string) (int, error) {
	for i, c := range version {
		switch c {
		case '0', '1', '2', '3', '4', '5', '6', '7', '8', '9':
			mjr, err := strconv.Atoi(version[i:])
			if err != nil {
				return 0, err
			}
			return mjr, nil
		}
	}
	return 0, errors.New("invalid-major-version")
}

func resolveMinorNumber(version string) (int, error) {
	mnr, err := strconv.Atoi(version)
	if err != nil {
		return 0, err
	}
	return mnr, nil
}

func resolvePatchNumber(version string) (int, error) {
	for i, c := range version {
		switch c {
		case '0', '1', '2', '3', '4', '5', '6', '7', '8', '9':
			ptc, err := strconv.Atoi(version[:i+1])
			if err != nil {
				return 0, err
			}
			return ptc, nil
		}
	}
	return 0, errors.New("invalid-patch-version")

	//ptc, err := strconv.Atoi(version)
	//if err != nil {
	//	return 0, err
	//}
	//return ptc, nil
}
