import { supabase } from './supabase.js';

export const dataService = {
  async loadUserProgress(userId) {
    const { data, error } = await supabase
      .from('study_progress')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error loading progress:', error);
      return {};
    }

    const progress = {};
    data.forEach(item => {
      progress[item.progress_key] = item.completed;
    });

    return progress;
  },

  async saveProgress(userId, progressKey, completed) {
    const { error } = await supabase
      .from('study_progress')
      .upsert({
        user_id: userId,
        progress_key: progressKey,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      }, {
        onConflict: 'user_id,progress_key',
      });

    if (error) {
      console.error('Error saving progress:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  async loadStudyPlans(userId) {
    const { data, error } = await supabase
      .from('study_plans')
      .select('*')
      .eq('user_id', userId)
      .order('study_date', { ascending: true });

    if (error) {
      console.error('Error loading study plans:', error);
      return [];
    }

    return data.map(plan => ({
      date: plan.study_date,
      duration: plan.duration,
      sessions: plan.sessions,
      id: plan.id,
    }));
  },

  async saveStudyPlan(userId, plan) {
    const { error } = await supabase
      .from('study_plans')
      .insert({
        user_id: userId,
        study_date: plan.date,
        duration: plan.duration,
        sessions: plan.sessions,
      });

    if (error) {
      console.error('Error saving study plan:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  async deleteStudyPlan(planId) {
    const { error } = await supabase
      .from('study_plans')
      .delete()
      .eq('id', planId);

    if (error) {
      console.error('Error deleting study plan:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  async clearAllStudyPlans(userId) {
    const { error } = await supabase
      .from('study_plans')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing study plans:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  async syncAllData(userId, progress, studyPlans) {
    const progressPromises = Object.entries(progress).map(([key, value]) =>
      this.saveProgress(userId, key, value)
    );

    const planPromises = studyPlans.map(plan =>
      this.saveStudyPlan(userId, plan)
    );

    await Promise.all([...progressPromises, ...planPromises]);
    return { success: true };
  },
};
