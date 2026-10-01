package com.gramai.complaint;

import java.util.Collections;
import java.util.Set;

/**
 * Lifecycle status of a Panchayat complaint with state machine transition rules.
 */
public enum ComplaintStatus {
    OPEN("खुली", "Open"),
    IN_PROGRESS("कार्य प्रगति पर", "In Progress"),
    WAITING("प्रतीक्षारत", "Waiting / Escalated"),
    RESOLVED("समाधान किया गया", "Resolved"),
    CLOSED("बंद", "Closed"),
    REJECTED("अस्वीकृत", "Rejected");

    private final String hindiLabel;
    private final String englishLabel;

    ComplaintStatus(String hindiLabel, String englishLabel) {
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

    /**
     * Checks if transitioning from this status to target status is valid according to business rules.
     *
     * @param target the desired next status
     * @return true if the transition is allowed
     */
    public boolean canTransitionTo(ComplaintStatus target) {
        if (target == null) {
            return false;
        }
        if (this == target) {
            return true;
        }

        return switch (this) {
            case OPEN -> target == IN_PROGRESS || target == REJECTED;
            case IN_PROGRESS -> target == WAITING || target == RESOLVED;
            case WAITING -> target == IN_PROGRESS || target == RESOLVED;
            case RESOLVED -> target == CLOSED || target == IN_PROGRESS;
            case CLOSED -> false; // Terminal state: reopening disallowed
            case REJECTED -> false; // Terminal state
        };
    }

    /**
     * Returns the set of valid next statuses from this status.
     */
    public Set<ComplaintStatus> getValidNextStatuses() {
        return switch (this) {
            case OPEN -> Set.of(IN_PROGRESS, REJECTED);
            case IN_PROGRESS -> Set.of(WAITING, RESOLVED);
            case WAITING -> Set.of(IN_PROGRESS, RESOLVED);
            case RESOLVED -> Set.of(CLOSED, IN_PROGRESS);
            case CLOSED, REJECTED -> Collections.emptySet();
        };
    }
}
