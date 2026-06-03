import { api } from '../lib/api'

export interface PublicStats {
  freelancers: number
  projects_completed: number
  avg_rating: number
}

export const statsService = {
  getPublic() {
    return api.get<PublicStats>('/api/stats/public')
  },
}
