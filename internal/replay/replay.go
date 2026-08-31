// Example replay loop update for compaction support.
// Integrate into your existing ReplayFromHead (or equivalent) method.

package replay

import (
	"fmt"

	"yourmodule/compaction"
)

// ReplayFromHead demonstrates the compaction-aware parent walk.
func (r *Replayer) ReplayFromHead(headID string) error {
	current := headID
	for current != "" {
		env, err := r.store.GetEnvelope(current)
		if err != nil {
			return err
		}

		if env.Lineage.CompactionRef != "" {
			snap, err := r.store.GetSnapshot(env.Lineage.CompactionRef)
			if err != nil {
				return fmt.Errorf("snapshot fetch: %w", err)
			}
			if err := compaction.VerifySnapshot(snap, r.verifier); err != nil {
				return fmt.Errorf("snapshot invalid: %w", err)
			}
			// jump to segment start (will replay that segment if archive is available,
			// otherwise trust snapshot)
			current = snap.SegmentStart
			continue
		}

		if len(env.Lineage.Parents) == 0 {
			break // root
		}
		current = env.Lineage.Parents[0]
	}
	return nil
}
