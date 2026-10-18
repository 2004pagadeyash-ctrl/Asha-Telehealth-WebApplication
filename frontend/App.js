import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'global-scroll-fixes';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          html, body {
            height: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background-color: #080C14 !important;
          }
          #root {
            display: flex !important;
            flex-direction: column !important;
            height: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background-color: #080C14 !important;
            min-height: 0 !important;
          }
          /* Ensure React Native flex containers can shrink to allow scrolling */
          div[style*="flex: 1"], div[class*="r-flex-13awgt0"], div[class*="r-flex-"] {
            min-height: 0 !important;
          }
          /* Ensure React Native ScrollView containers can scroll smoothly on web */
          [data-testid="scroll-view"], [class*="r-overflowY-scroll"], [class*="r-overflowY-auto"] {
            -webkit-overflow-scrolling: touch !important;
            overflow-y: auto !important;
          }
          /* Make all RN ScrollView divs with overflow-y scrollable */
          div[style*="overflow: auto"], div[style*="overflow-y: auto"],
          div[style*="overflow: scroll"], div[style*="overflow-y: scroll"],
          div[style*="overflowY: auto"], div[style*="overflowY: scroll"] {
            -webkit-overflow-scrolling: touch !important;
            overflow-y: auto !important;
          }
          /* Custom sleek scrollbar for web */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #080C14;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 201, 255, 0.6);
          }
        `;
        document.head.appendChild(style);
      }

      // Universal mouse wheel handler:
      // Ensures vertical scrolling works smoothly across the entire page,
      // even when hovering over horizontal sliders (GenderScroll / AgeScroll), cards, inputs, or margins.
      const handleGlobalWheel = (e) => {
        // If horizontal scrolling or shift key is used, let the element handle horizontal scroll
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
          return;
        }

        // Check if cursor is directly inside a container that can ACTUALLY scroll vertically
        let el = e.target;
        let activeVerticalScroll = null;

        while (el && el !== document.body && el !== document.documentElement) {
          const comp = window.getComputedStyle(el);
          const isScrollable = (comp.overflowY === 'auto' || comp.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 1;
          if (isScrollable) {
            const atTop = el.scrollTop <= 0 && e.deltaY < 0;
            const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1 && e.deltaY > 0;
            if (!atTop && !atBottom) {
              activeVerticalScroll = el;
              break;
            }
          }
          el = el.parentElement;
        }

        // If hovering over an element that cannot scroll vertically (e.g. horizontal ScrollView, card, background)
        // or one that has hit its vertical boundary, scroll the main vertical scroller!
        if (!activeVerticalScroll) {
          const candidates = document.querySelectorAll('[class*="r-overflowY"], [style*="overflow-y"], [style*="overflowY"], div');
          let mainScroller = null;

          for (let i = 0; i < candidates.length; i++) {
            const elem = candidates[i];
            const comp = window.getComputedStyle(elem);
            if ((comp.overflowY === 'auto' || comp.overflowY === 'scroll') && elem.scrollHeight > elem.clientHeight + 1) {
              if (!mainScroller || elem.scrollHeight > mainScroller.scrollHeight) {
                mainScroller = elem;
              }
            }
          }

          if (mainScroller) {
            mainScroller.scrollTop += e.deltaY;
          }
        }
      };

      window.addEventListener('wheel', handleGlobalWheel, { passive: true });
      return () => {
        window.removeEventListener('wheel', handleGlobalWheel);
      };
    }
  }, []);


  return (
    <SafeAreaProvider style={{ flex: 1, height: '100%' }}>
      <PaperProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
