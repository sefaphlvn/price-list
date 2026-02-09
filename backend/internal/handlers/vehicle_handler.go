package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/spehlivan/price-list/backend/internal/repository"
)

type VehicleHandler struct {
	repo *repository.VehicleRepository
}

func NewVehicleHandler(repo *repository.VehicleRepository) *VehicleHandler {
	return &VehicleHandler{repo: repo}
}

// GetIndex returns available dates per brand
func (h *VehicleHandler) GetIndex(c *gin.Context) {
	data, err := h.repo.GetIndex(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch index"})
		return
	}
	c.JSON(http.StatusOK, data)
}

// GetLatest returns the latest data for all brands
func (h *VehicleHandler) GetLatest(c *gin.Context) {
	data, err := h.repo.GetLatest(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch latest data"})
		return
	}
	c.JSON(http.StatusOK, data)
}

// GetVehicles returns vehicle data for a specific brand and date
func (h *VehicleHandler) GetVehicles(c *gin.Context) {
	brand := c.Query("brand")
	date := c.Query("date")

	if brand == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "brand query parameter is required"})
		return
	}

	if date == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "date query parameter is required"})
		return
	}

	data, err := h.repo.GetByBrandAndDate(c.Request.Context(), brand, date)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data not found for the specified brand and date"})
		return
	}

	c.JSON(http.StatusOK, data)
}
