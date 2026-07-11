package com.taskbridge.taskservice.specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;

import com.taskbridge.taskservice.model.Task;
import com.taskbridge.taskservice.model.TaskCategory;
import com.taskbridge.taskservice.model.TaskStatus;

import jakarta.persistence.criteria.Predicate;

public class TaskSpecification {

    private TaskSpecification() {
        // utility class, no instances
    }

    public static Specification<Task> withFilters(
            TaskStatus status,
            TaskCategory category,
            BigDecimal budgetMin,
            BigDecimal budgetMax,
            UUID posterId,
            UUID assignedTo,
            String search
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }

            if (budgetMin != null) {
                predicates.add(cb.ge(root.get("budgetLkr"), budgetMin));
            }

            if (budgetMax != null) {
                predicates.add(cb.le(root.get("budgetLkr"), budgetMax));
            }

            if (posterId != null) {
                predicates.add(cb.equal(root.get("posterId"), posterId));
            }

            if (assignedTo != null) {
                predicates.add(cb.equal(root.get("assignedTo"), assignedTo));
            }

            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(root.get("description")), like)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
