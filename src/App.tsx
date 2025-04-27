import './App.css'
import Calendar from "./components/calendar/Calendar.tsx";
import {CalendarProvider} from "./CalendarContext.tsx";

function App() {

  return (
    <CalendarProvider>
      <Calendar/>
    </CalendarProvider>
  )
}

export default App
