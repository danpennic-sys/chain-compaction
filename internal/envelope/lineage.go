package envelope

type Lineage struct {
	Parents        []string `json:"parents"`
	CompactionRef  string   `json:"compaction_ref,omitempty"` // snapshot ID (UUID)
}
