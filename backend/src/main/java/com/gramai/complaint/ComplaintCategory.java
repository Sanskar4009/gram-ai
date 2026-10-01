package com.gramai.complaint;

/**
 * Domain categories for Gram Panchayat complaints and citizen grievances.
 *
 * <p>Designed to be extensible as new public schemes and infrastructure
 * programs are adopted by Panchayats.</p>
 */
public enum ComplaintCategory {
    WATER("पेयजल", "Water Supply"),
    SCHOOL("शाला / शिक्षा", "Primary & Secondary School"),
    ROAD("सड़क एवं पुलिया", "Road & Culvert Infrastructure"),
    SANITATION("स्वच्छता एवं नाली", "Sanitation & Drainage"),
    HEALTH("स्वास्थ्य सेवाएं", "Primary Health Services"),
    ANGANWADI("आंगनवाड़ी", "Anganwadi & Child Nutrition"),
    MGNREGA("मनरेगा", "MGNREGA Works & Muster"),
    HOUSING("पीएम आवास", "PM Awas Housing"),
    STREET_LIGHT("स्ट्रीट लाइट", "Street Lighting"),
    OTHER("अन्य", "Other Grievances");

    private final String hindiLabel;
    private final String englishLabel;

    ComplaintCategory(String hindiLabel, String englishLabel) {
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
