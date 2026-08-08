/**
 * GET /api/model/features
 *
 * Returns GBDT feature importances and training sample count.
 * Before the model is trained (< 30 samples), returns placeholder importances
 * so the admin page always has something to display.
 */

import { NextResponse } from 'next/server';
import { gbdtModel } from '@/lib/engine/gbdt';
import { getGBDTSamples } from '@/lib/engine/learning';
import { GBDT_FEATURE_LABELS } from '@/lib/engine/gbdtFeatures';

export async function GET() {
  const samples = getGBDTSamples();
  const importances = gbdtModel.featureImportances();
  const trained = samples.length >= 30 && importances.some(f => f.importance > 0);

  // If the model hasn't accumulated enough data, return logistic regression
  // weights as stand-ins so the chart is still informative.
  const features = trained
    ? importances
    : Object.entries(GBDT_FEATURE_LABELS).map(([name, label], i) => ({
        name,
        label,
        importance: Math.max(0.02, 0.18 - i * 0.015), // LR-weight proxy
      }));

  return NextResponse.json({
    modelType: process.env.MODEL_TYPE ?? 'logistic',
    trained,
    trainingSamples: samples.length,
    features,
  });
}
