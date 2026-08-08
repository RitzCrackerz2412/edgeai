-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "favoriteTeams" TEXT[],
    "favoriteSports" TEXT[],
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailDigest" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT NOT NULL DEFAULT 'dark',

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "league" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "homeTeamName" TEXT NOT NULL,
    "awayTeamName" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "venue" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "period" INTEGER,
    "clock" TEXT,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "weatherData" JSONB,
    "oddsData" JSONB,
    "h2hData" JSONB,
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "winner" TEXT NOT NULL,
    "winProbability" DOUBLE PRECISION NOT NULL,
    "confidence" INTEGER NOT NULL,
    "predictedHomeScore" INTEGER NOT NULL,
    "predictedAwayScore" INTEGER NOT NULL,
    "expectedMargin" INTEGER NOT NULL,
    "upsetProbability" DOUBLE PRECISION NOT NULL,
    "factors" JSONB NOT NULL,
    "featureValues" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameOutcome" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "actualWinner" TEXT NOT NULL,
    "actualHomeScore" INTEGER NOT NULL,
    "actualAwayScore" INTEGER NOT NULL,
    "finalStatus" TEXT NOT NULL DEFAULT 'final',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validationResultId" TEXT,

    CONSTRAINT "GameOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationResult" (
    "id" TEXT NOT NULL,
    "predictionId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "rawProbability" DOUBLE PRECISION NOT NULL,
    "actualOutcome" INTEGER NOT NULL,
    "brierScore" DOUBLE PRECISION NOT NULL,
    "logLoss" DOUBLE PRECISION NOT NULL,
    "marginError" DOUBLE PRECISION NOT NULL,
    "validatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalibrationRecord" (
    "id" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "rawProbability" DOUBLE PRECISION NOT NULL,
    "outcome" INTEGER NOT NULL,
    "sport" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalibrationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelVersion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "brierScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "logLoss" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gamesValidated" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),

    CONSTRAINT "ModelVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccuracySnapshot" (
    "id" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "sport" TEXT,
    "league" TEXT,
    "totalGames" INTEGER NOT NULL,
    "correctPredictions" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "brierScore" DOUBLE PRECISION NOT NULL,
    "logLoss" DOUBLE PRECISION NOT NULL,
    "calibrationData" JSONB NOT NULL,

    CONSTRAINT "AccuracySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sport" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "result" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GBDTSample" (
    "id" TEXT NOT NULL,
    "gameId" TEXT,
    "sport" TEXT,
    "features" DOUBLE PRECISION[],
    "outcome" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'live',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GBDTSample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoredPredictionRecord" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "homeTeamName" TEXT NOT NULL,
    "awayTeamName" TEXT NOT NULL,
    "gameDate" TEXT NOT NULL,
    "homeWinProbability" DOUBLE PRECISION NOT NULL,
    "predictedHomeScore" INTEGER,
    "predictedAwayScore" INTEGER,
    "gbdtFeatures" DOUBLE PRECISION[],
    "predictedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "StoredPredictionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "Game_scheduledAt_idx" ON "Game"("scheduledAt");

-- CreateIndex
CREATE INDEX "Game_sport_status_idx" ON "Game"("sport", "status");

-- CreateIndex
CREATE INDEX "Game_sourceId_idx" ON "Game"("sourceId");

-- CreateIndex
CREATE INDEX "Prediction_gameId_idx" ON "Prediction"("gameId");

-- CreateIndex
CREATE INDEX "Prediction_createdAt_idx" ON "Prediction"("createdAt");

-- CreateIndex
CREATE INDEX "Prediction_modelVersion_idx" ON "Prediction"("modelVersion");

-- CreateIndex
CREATE UNIQUE INDEX "GameOutcome_gameId_key" ON "GameOutcome"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "ValidationResult_predictionId_key" ON "ValidationResult"("predictionId");

-- CreateIndex
CREATE INDEX "ValidationResult_sport_idx" ON "ValidationResult"("sport");

-- CreateIndex
CREATE INDEX "ValidationResult_validatedAt_idx" ON "ValidationResult"("validatedAt");

-- CreateIndex
CREATE INDEX "ValidationResult_gameId_idx" ON "ValidationResult"("gameId");

-- CreateIndex
CREATE INDEX "CalibrationRecord_modelVersion_idx" ON "CalibrationRecord"("modelVersion");

-- CreateIndex
CREATE INDEX "CalibrationRecord_sport_idx" ON "CalibrationRecord"("sport");

-- CreateIndex
CREATE UNIQUE INDEX "ModelVersion_name_key" ON "ModelVersion"("name");

-- CreateIndex
CREATE INDEX "AccuracySnapshot_computedAt_idx" ON "AccuracySnapshot"("computedAt");

-- CreateIndex
CREATE INDEX "AccuracySnapshot_sport_idx" ON "AccuracySnapshot"("sport");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "SyncJob_type_status_idx" ON "SyncJob"("type", "status");

-- CreateIndex
CREATE INDEX "SyncJob_createdAt_idx" ON "SyncJob"("createdAt");

-- CreateIndex
CREATE INDEX "GBDTSample_createdAt_idx" ON "GBDTSample"("createdAt");

-- CreateIndex
CREATE INDEX "GBDTSample_sport_idx" ON "GBDTSample"("sport");

-- CreateIndex
CREATE INDEX "GBDTSample_source_idx" ON "GBDTSample"("source");

-- CreateIndex
CREATE UNIQUE INDEX "StoredPredictionRecord_gameId_key" ON "StoredPredictionRecord"("gameId");

-- CreateIndex
CREATE INDEX "StoredPredictionRecord_gameDate_idx" ON "StoredPredictionRecord"("gameDate");

-- CreateIndex
CREATE INDEX "StoredPredictionRecord_sport_gameDate_idx" ON "StoredPredictionRecord"("sport", "gameDate");

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameOutcome" ADD CONSTRAINT "GameOutcome_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameOutcome" ADD CONSTRAINT "GameOutcome_validationResultId_fkey" FOREIGN KEY ("validationResultId") REFERENCES "ValidationResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationResult" ADD CONSTRAINT "ValidationResult_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
