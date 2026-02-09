package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/spehlivan/price-list/backend/internal/repository"
)

type StatsHandler struct {
	repo *repository.StatsRepository
}

func NewStatsHandler(repo *repository.StatsRepository) *StatsHandler {
	return &StatsHandler{repo: repo}
}

// GetStats returns the latest precomputed statistics
func (h *StatsHandler) GetStats(c *gin.Context) {
	data, err := h.repo.GetLatest(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch statistics"})
		return
	}
	c.JSON(http.StatusOK, data)
}
