package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/spehlivan/price-list/backend/internal/repository"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type IntelHandler struct {
	repo *repository.IntelRepository
}

func NewIntelHandler(repo *repository.IntelRepository) *IntelHandler {
	return &IntelHandler{repo: repo}
}

// respondWithData handles common error/success response for intel endpoints
func respondWithData(c *gin.Context, data any, err error, label string) {
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			c.JSON(http.StatusNotFound, gin.H{"error": label + " data not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch " + label + " data"})
		return
	}
	c.JSON(http.StatusOK, data)
}

// GetEvents returns the latest price change events
func (h *IntelHandler) GetEvents(c *gin.Context) {
	data, err := h.repo.GetEvents(c.Request.Context())
	respondWithData(c, data, err, "events")
}

// GetArchitecture returns the latest trim ladder / architecture data
func (h *IntelHandler) GetArchitecture(c *gin.Context) {
	data, err := h.repo.GetArchitecture(c.Request.Context())
	respondWithData(c, data, err, "architecture")
}

// GetGaps returns the latest market gaps data
func (h *IntelHandler) GetGaps(c *gin.Context) {
	data, err := h.repo.GetGaps(c.Request.Context())
	respondWithData(c, data, err, "gaps")
}

// GetPromos returns the latest price drops / promotions data
func (h *IntelHandler) GetPromos(c *gin.Context) {
	data, err := h.repo.GetPromos(c.Request.Context())
	respondWithData(c, data, err, "promos")
}

// GetLifecycle returns the latest model lifecycle data
func (h *IntelHandler) GetLifecycle(c *gin.Context) {
	data, err := h.repo.GetLifecycle(c.Request.Context())
	respondWithData(c, data, err, "lifecycle")
}

// GetErrors returns the latest error log
func (h *IntelHandler) GetErrors(c *gin.Context) {
	data, err := h.repo.GetErrors(c.Request.Context())
	respondWithData(c, data, err, "errors")
}

// GetInsights returns the latest deal scores and outlier data
func (h *IntelHandler) GetInsights(c *gin.Context) {
	data, err := h.repo.GetInsights(c.Request.Context())
	respondWithData(c, data, err, "insights")
}
