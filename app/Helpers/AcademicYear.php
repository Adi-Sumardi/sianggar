<?php

declare(strict_types=1);

namespace App\Helpers;

class AcademicYear
{
    /**
     * Get the current academic year string (e.g., "2025/2026").
     * Academic year runs July–June: month >= 7 means new academic year.
     */
    public static function current(): string
    {
        $year = (int) date('Y');
        $month = (int) date('n');

        if ($month >= 7) {
            return $year . '/' . ($year + 1);
        }

        return ($year - 1) . '/' . $year;
    }

    /**
     * Convert single year to academic year.
     * "2026" → "2025/2026"
     */
    public static function fromSingleYear(string $singleYear): string
    {
        $year = (int) $singleYear;

        return ($year - 1) . '/' . $year;
    }

    /**
     * Validate academic year format "YYYY/YYYY".
     */
    public static function isValid(string $value): bool
    {
        if (! preg_match('/^\d{4}\/\d{4}$/', $value)) {
            return false;
        }

        [$start, $end] = explode('/', $value);

        return ((int) $end - (int) $start) === 1;
    }

    /**
     * Get start year from academic year string.
     * "2025/2026" → 2025
     */
    public static function startYear(string $academicYear): int
    {
        return (int) explode('/', $academicYear)[0];
    }

    /**
     * Get end year from academic year string.
     * "2025/2026" → 2026
     */
    public static function endYear(string $academicYear): int
    {
        return (int) explode('/', $academicYear)[1];
    }
}
