import { useState, useEffect, useCallback, useRef } from 'react';
import { DayColumn } from '../components/meal-plan/DayColumn';
import { RecipePickerModal } from '../components/meal-plan/RecipePickerModal';
import { WeekNavigation } from '../components/meal-plan/WeekNavigation';
import { fetchCurrentMealPlan, deleteMealPlanEntry } from '../services/mealPlanApi';
import type { MealPlan, MealType } from '../types/mealPlan';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

import { getCurrentWeekMonday } from '../utils/dateUtils';

function formatWeekStartParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getWeekDates(weekStart: string): string[] {
  const start = new Date(weekStart + 'T00:00:00');
  return DAY_NAMES.map((_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

function getTodayDayIndex(dates: string[]): number {
  const today = new Date().toISOString().split('T')[0];
  return dates.findIndex((d) => d === today);
}

interface ModalState {
  isOpen: boolean;
  mealType: MealType;
  dayIndex: number;
}

export default function MealPlanPage() {
  const [weekStart, setWeekStart] = useState<Date>(getCurrentWeekMonday);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mealType: 'breakfast',
    dayIndex: 0,
  });
  const fetchCounterRef = useRef(0);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const requestId = ++fetchCounterRef.current;
    const loadMealPlan = async () => {
      setLoading(true);
      try {
        const data = await fetchCurrentMealPlan(formatWeekStartParam(weekStart));
        if (requestId !== fetchCounterRef.current) return;
        setMealPlan(data);
      } catch {
        if (requestId !== fetchCounterRef.current) return;
        setError('Error loading meal plan');
      } finally {
        if (requestId === fetchCounterRef.current) {
          setLoading(false);
        }
      }
    };
    loadMealPlan();
  }, [weekStart, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const handleSlotClick = useCallback((dayIndex: number, mealType: MealType) => {
    setModal({ isOpen: true, mealType, dayIndex });
  }, []);

  const handleModalClose = useCallback(() => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleAssign = useCallback(() => {
    reload();
  }, [reload]);

  const handleRemove = useCallback(
    async (entryId: string) => {
      if (!mealPlan) return;
      try {
        await deleteMealPlanEntry(mealPlan.id, entryId);
        reload();
      } catch {
        // Could show error toast
      }
    },
    [mealPlan, reload]
  );

  const handleWeekChange = useCallback((newWeekStart: Date) => {
    setWeekStart(newWeekStart);
  }, []);

  const dates = mealPlan ? getWeekDates(mealPlan.weekStart) : [];
  const todayIndex = mealPlan ? getTodayDayIndex(dates) : -1;

  const renderContent = () => {
    if (loading) {
      return <div className="text-text-secondary">Loading...</div>;
    }
    if (error) {
      return <div className="text-text-secondary">{error}</div>;
    }
    if (!mealPlan) {
      return null;
    }
    return (
      <>
        <div
          className="grid grid-cols-1 md:grid-cols-7 gap-2 mt-4"
          data-testid="meal-plan-calendar"
        >
          {DAY_NAMES.map((dayName, i) => {
            const dayEntries = mealPlan.entries
              .filter((e) => e.dayOfWeek === i)
              .map((e) => ({
                id: e.id,
                meal_type: e.mealType,
                recipe: e.recipe
                  ? {
                      id: e.recipe.id,
                      title: e.recipe.title,
                      cook_time_minutes: e.recipe.cookTimeMinutes,
                    }
                  : null,
              }));

            return (
              <DayColumn
                key={dayName}
                dayName={dayName}
                date={dates[i]}
                entries={dayEntries}
                isToday={i === todayIndex}
                onSlotClick={(mealType) => handleSlotClick(i, mealType)}
                onRemoveClick={(entryId) => handleRemove(entryId)}
              />
            );
          })}
        </div>
        <RecipePickerModal
          isOpen={modal.isOpen}
          onClose={handleModalClose}
          mealType={modal.mealType}
          date={dates[modal.dayIndex]}
          mealPlanId={mealPlan.id}
          onAssign={handleAssign}
        />
      </>
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-text-primary mb-4">Meal Plan</h1>
      <WeekNavigation weekStart={weekStart} onWeekChange={handleWeekChange} />
      {renderContent()}
    </div>
  );
}
