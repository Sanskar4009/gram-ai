package com.gramai.complaint;

/**
 * Operational priority levels for Panchayat complaints.
 */
public enum ComplaintPriority {
    LOW("सामान्य", "Low"),
    MEDIUM("मध्यम", "Medium"),
    HIGH("उच्च", "High"),
    URGENT("अति आवश्यक", "Urgent");

    private final String hindiLabel;
    private final String englishLabel;

    ComplaintPriority(String hindiLabel, String englishLabel) {
        this.hindiLabel = hindiLabel;
        this.englishLabel = englishLabel;
    }

    public String getHindiLabel() {
        return hindiLabel;
    }

    public String getEnglishLabel() {
        return englishLabel;
    }

    public String getDisplayName() {
        return hindiLabel + " (" + englishLabel + ")";
    }
}
