import './App.css'
import Calendar from "./components/main-calendar/Calendar.tsx";
import {CalendarProvider} from "./context/CalendarContext.tsx";

function App() {

  return (
    <CalendarProvider>
      <Calendar/>
    </CalendarProvider>
  )
}

export default App
