package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/spehlivan/price-list/backend/internal/repository"
)

type IntelHandler struct {
	repo *repository.IntelRepository
}

func NewIntelHandler(repo *repository.IntelRepository) *IntelHandler {
	return &IntelHandler{repo: repo}
}

// GetEvents returns the latest price change events
func (h *IntelHandler) GetEvents(c *gin.Context) {
	data, err := h.repo.GetEvents(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch events data"})
		return
	}
	c.JSON(http.StatusOK, data)
}

// GetArchitecture returns the latest trim ladder / architecture data
func (h *IntelHandler) GetArchitecture(c *gin.Context) {
	data, err := h.repo.GetArchitecture(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch architecture data"})
		return
	}
	c.JSON(http.StatusOK, data)
}

// GetGaps returns the latest market gaps data
func (h *IntelHandler) GetGaps(c *gin.Context) {
	data, err := h.repo.GetGaps(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch gaps data"})
		return
	}
	c.JSON(http.StatusOK, data)
}

// GetPromos returns the latest price drops / promotions data
func (h *IntelHandler) GetPromos(c *gin.Context) {
	data, err := h.repo.GetPromos(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch promos data"})
		return
	}
	c.JSON(http.StatusOK, data)
}

// GetLifecycle returns the latest model lifecycle data
func (h *IntelHandler) GetLifecycle(c *gin.Context) {
	data, err := h.repo.GetLifecycle(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch lifecycle data"})
		return
	}
	c.JSON(http.StatusOK, data)
}

// GetErrors returns the latest error log
func (h *IntelHandler) GetErrors(c *gin.Context) {
	data, err := h.repo.GetErrors(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch errors data"})
		return
	}
	c.JSON(http.StatusOK, data)
}
