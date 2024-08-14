package npm

type ByVersion []PackageVersion

func (v ByVersion) Len() int {
	return len(v)
}

func (v ByVersion) Swap(i, j int) {
	v[i], v[j] = v[j], v[i]
}

func (v ByVersion) Less(i, j int) bool {
	if v[i].Major != v[j].Major {
		return v[i].Major < v[j].Major
	}
	if v[i].Minor != v[j].Minor {
		return v[i].Minor < v[j].Minor
	}
	return v[i].Patch < v[j].Patch
}
