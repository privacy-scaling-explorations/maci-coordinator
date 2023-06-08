package src

import (
	"testing"
)

func TestModuleName(t *testing.T) {
	if ProjectName() != "maci-coordinator" {
		t.Errorf("Project name `%s` incorrect", ProjectName())
	}
}
