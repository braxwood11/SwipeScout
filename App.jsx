import SwipeDeck from './components/SwipeDeck';
import Plan from './pages/Plan';

export default function App() {
  const showPlan = window.location.search.includes('plan');
  return showPlan ? <Plan/> : <SwipeDeck/>;
}
