import type { Candidate, Job } from "@/types/database";

export interface MatchScore {
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  breakdown: {
    skills: number;
    location: number;
    experience: number;
    salary: number;
    availability: number;
  };
}

/**
 * Parse a salary range string like "$55,000 - $72,000" or "$22 - $30/hr"
 * into { min, max } numbers. Returns null if unparseable.
 */
function parseSalaryRange(range: string | null): { min: number; max: number } | null {
  if (!range) return null;
  const numbers = range.match(/[\d,]+\.?\d*/g);
  if (!numbers || numbers.length === 0) return null;

  const parsed = numbers.map((n) => parseFloat(n.replace(/,/g, "")));
  const isHourly = /hr|hour/i.test(range);

  // Convert hourly to annual (2080 hours/year)
  const multiplier = isHourly ? 2080 : 1;
  // If numbers are small (< 200), assume thousands
  const normalize = (v: number) => {
    const val = v * multiplier;
    return val < 200 ? val * 1000 : val;
  };

  if (parsed.length >= 2) {
    return { min: normalize(parsed[0]), max: normalize(parsed[1]) };
  }
  const single = normalize(parsed[0]);
  return { min: single * 0.9, max: single * 1.1 };
}

/**
 * Normalize a location string for comparison.
 * Extracts city and state components.
 */
function normalizeLocation(loc: string | null): string[] {
  if (!loc) return [];
  return loc
    .toLowerCase()
    .replace(/[,./]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

/**
 * Score a candidate against a job.
 * Returns a breakdown of scores across multiple dimensions.
 *
 * Weights:
 *  - Skills overlap: 40 points max
 *  - Location match: 20 points max
 *  - Experience fit: 15 points max
 *  - Salary fit: 15 points max
 *  - Availability (status): 10 points max
 */
export function scoreMatch(candidate: Candidate, job: Job): MatchScore {
  const breakdown = { skills: 0, location: 0, experience: 0, salary: 0, availability: 0 };
  const maxScore = 100;

  // --- Skills (40 pts max) ---
  const candidateSkills = (candidate.skills ?? []).map((s) => s.toLowerCase().trim());
  const jobText = [job.title, job.description ?? ""].join(" ").toLowerCase();

  if (candidateSkills.length > 0) {
    let matchCount = 0;
    for (const skill of candidateSkills) {
      if (jobText.includes(skill)) {
        matchCount++;
      }
    }
    // Score based on ratio of matching skills to total candidate skills
    const ratio = matchCount / candidateSkills.length;
    breakdown.skills = Math.round(ratio * 40);
  }

  // --- Location (20 pts max) ---
  const candidateLoc = normalizeLocation(candidate.location);
  const jobLoc = normalizeLocation(job.location);

  if (candidateLoc.length > 0 && jobLoc.length > 0) {
    // Check for "remote" in job
    if (jobLoc.includes("remote")) {
      breakdown.location = 20;
    } else {
      const common = candidateLoc.filter((w) => jobLoc.includes(w));
      if (common.length >= 2) {
        breakdown.location = 20; // City + State match
      } else if (common.length === 1) {
        breakdown.location = 10; // Partial match (state only)
      }
    }
  }

  // --- Experience (15 pts max) ---
  if (candidate.years_experience != null) {
    // Extract years requirement from job description
    const yearsMatch = jobText.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
    if (yearsMatch) {
      const required = parseInt(yearsMatch[1], 10);
      const diff = candidate.years_experience - required;
      if (diff >= 0) {
        breakdown.experience = 15; // Meets or exceeds
      } else if (diff >= -2) {
        breakdown.experience = 10; // Close
      } else {
        breakdown.experience = 3; // Under-qualified but has some experience
      }
    } else {
      // No explicit requirement — give credit for having experience
      breakdown.experience = Math.min(candidate.years_experience * 2, 12);
    }
  }

  // --- Salary (15 pts max) ---
  const salaryRange = parseSalaryRange(job.salary_range);
  if (salaryRange && candidate.desired_salary != null) {
    const desired = candidate.desired_salary;
    if (desired >= salaryRange.min && desired <= salaryRange.max) {
      breakdown.salary = 15; // Within range
    } else if (desired < salaryRange.min) {
      breakdown.salary = 12; // Under budget — still good
    } else {
      // Over budget
      const overBy = (desired - salaryRange.max) / salaryRange.max;
      if (overBy <= 0.1) {
        breakdown.salary = 8; // Slightly over
      } else if (overBy <= 0.25) {
        breakdown.salary = 4; // Moderately over
      }
    }
  } else if (salaryRange || candidate.desired_salary != null) {
    // One side has data — give partial credit
    breakdown.salary = 5;
  }

  // --- Availability (10 pts max) ---
  const availabilityMap: Record<string, number> = {
    new: 10,
    contacted: 8,
    interviewing: 5,
    placed: 0,
    rejected: 0,
  };
  breakdown.availability = availabilityMap[candidate.status] ?? 0;

  const score =
    breakdown.skills + breakdown.location + breakdown.experience + breakdown.salary + breakdown.availability;

  return {
    candidateId: candidate.id,
    candidateName: candidate.full_name,
    jobId: job.id,
    jobTitle: job.title,
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    breakdown,
  };
}

/**
 * Find top candidate matches for a job, sorted by score descending.
 */
export function getTopCandidatesForJob(
  candidates: Candidate[],
  job: Job,
  limit = 5
): MatchScore[] {
  return candidates
    .filter((c) => c.status !== "placed" && c.status !== "rejected")
    .map((c) => scoreMatch(c, job))
    .filter((m) => m.score > 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Find top job matches for a candidate, sorted by score descending.
 */
export function getTopJobsForCandidate(
  candidate: Candidate,
  jobs: Job[],
  limit = 5
): MatchScore[] {
  return jobs
    .filter((j) => j.status === "open")
    .map((j) => scoreMatch(candidate, j))
    .filter((m) => m.score > 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
