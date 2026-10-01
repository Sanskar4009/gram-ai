package com.gramai.complaint.dto;

import java.util.Map;

public record ComplaintSummaryResponse(
        long total,
        long open,
        long inProgress,
        long waiting,
        long resolved,
        long closed,
        long rejected,
        Map<String, Long> byCategory,
        Map<String, Long> byPriority
) {
}
