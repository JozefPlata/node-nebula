package npm

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
)

func ParseVersion(version string) (PackageVersion, error) {
	pkgVersion, err := parseVersion(version)
	return pkgVersion, err
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
	if len(s) < 3 {
		msg := fmt.Sprintf("parseVersion(%s): - minor or patch not found", version)
		return PackageVersion{}, errors.New(msg)
	}

	mjr, err := parseMajorNumber(s[0])
	if err != nil {
		return PackageVersion{}, err
	}
	mnr, err := parseMinorNumber(s[1])
	if err != nil {
		return PackageVersion{}, err
	}
	ptc, err := parsePatchNumber(s[2])
	if err != nil {
		return PackageVersion{}, err
	}

	verbose := fmt.Sprintf("%d", mjr)
	for i, v := range s {
		if i > 0 {
			verbose = fmt.Sprintf("%s.%s", verbose, v)
		}
	}

	return PackageVersion{
		Prefix:  prefix,
		Major:   mjr,
		Minor:   mnr,
		Patch:   ptc,
		Verbose: verbose,
	}, nil
}

func parseMajorNumber(version string) (int, error) {
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

func parseMinorNumber(version string) (int, error) {
	mnr, err := strconv.Atoi(version)
	if err != nil {
		return 0, err
	}
	return mnr, nil
}

func parsePatchNumber(version string) (int, error) {
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
