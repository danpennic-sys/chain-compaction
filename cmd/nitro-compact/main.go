package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"yourmodule/nitroclient"
)

func main() {
	start := flag.String("start", "", "segment start event ID")
	end := flag.String("end", "", "segment end event ID")
	dryRun := flag.Bool("dry-run", false, "only compute, do not persist")
	flag.Parse()

	if *start == "" || *end == "" {
		fmt.Fprintln(os.Stderr, "usage: nitro-compact --start <uuid> --end <uuid> [--dry-run]")
		os.Exit(1)
	}

	client := nitroclient.New(os.Getenv("NITRO_URL"), os.Getenv("NITRO_TOKEN"))

	if *dryRun {
		// fetch segment and compute root hash (simulated)
		fmt.Printf("dry run: would compact %s → %s\n", *start, *end)
		return
	}

	id, err := client.CreateSnapshot(*start, *end)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("compaction snapshot created: %s\n", id)
}
