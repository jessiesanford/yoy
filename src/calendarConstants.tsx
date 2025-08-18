import {
  SnowflakeIcon,
  HeartIcon,
  CloverIcon,
  UmbrellaIcon,
  SunIcon,
  FlowerLotusIcon,
  BeachBallIcon, GraduationCapIcon, GhostIcon, FeatherIcon, GiftIcon, TentIcon
} from "@phosphor-icons/react";
import { ReactNode } from "react";


export const monthColors: Record<string, string> = {
  January: "#7FB3D5",    // light blue
  February: "#efa1a1",   // soft pink
  March: "#82E0AA",      // light green
  April: "#85C1E9",      // sky blue
  May: "#F7DC6F",        // light yellow
  June: "#76D7C4",       // aqua
  July: "#F5B041",       // warm orange
  August: "#F8C471",     // golden
  September: "#A3E4D7",  // minty green
  October: "#E59866",    // muted orange
  November: "#BB8FCE",   // lavender
  December: "#d15353",   // soft blue
};

export const monthIcons: Record<string, ReactNode> = {
  January: <SnowflakeIcon/>,
  February: <HeartIcon weight={'fill'}/>,
  March: <CloverIcon/>,
  April:  <UmbrellaIcon/>,
  May:  <FlowerLotusIcon/>,
  June:  <SunIcon/>,
  July:  <TentIcon/>,
  August:  <BeachBallIcon/>,
  September:  <GraduationCapIcon/>,
  October:  <GhostIcon/>,
  November:  <FeatherIcon/>,
  December:  <GiftIcon/>,
};