/** Shared thresholds — change here to tune all features at once */

/** Drift alert: rolling accuracy must drop this many pp below baseline to flag red */
export const DRIFT_ALERT_THRESHOLD = 8;

/** Drift warning: rolling accuracy drop required for yellow badge */
export const DRIFT_WARN_THRESHOLD = 4;

/** Ensemble disagreement: std dev above this % triggers "High Uncertainty" badge */
export const DISAGREEMENT_THRESHOLD = 12;

/** Rolling window size (games) for drift detection */
export const ROLLING_WINDOW_GAMES = 20;
