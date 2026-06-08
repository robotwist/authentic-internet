import {
  buildExperienceUpdatePipeline,
  normalizeExperienceInput,
} from '../experienceProgress.js';

describe('experience progress updates', () => {
  it('normalizes valid XP totals and rejects unsafe totals', () => {
    expect(normalizeExperienceInput(123.9)).toBe(123);
    expect(normalizeExperienceInput(0)).toBe(0);
    expect(normalizeExperienceInput(-1)).toBeNull();
    expect(normalizeExperienceInput(Number.POSITIVE_INFINITY)).toBeNull();
    expect(normalizeExperienceInput('5')).toBeNull();
  });

  it('builds a non-decreasing XP update pipeline', () => {
    expect(buildExperienceUpdatePipeline(5)).toEqual([
      {
        $set: {
          experience: {
            $max: [{ $ifNull: ['$experience', 0] }, 5],
          },
          level: {
            $max: [
              { $ifNull: ['$level', 1] },
              {
                $add: [
                  {
                    $floor: {
                      $divide: [
                        { $max: [{ $ifNull: ['$experience', 0] }, 5] },
                        100,
                      ],
                    },
                  },
                  1,
                ],
              },
            ],
          },
        },
      },
    ]);
  });
});
