'use client';

import { useEffect, useState } from 'react';
import { Joyride, EventData, STATUS, Step } from 'react-joyride';
import { theme } from '@/lib/theme';

export default function DashboardTour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Only run tour if the user hasn't seen it yet
    const hasSeenTour = localStorage.getItem('studioarella_tour_seen');
    if (!hasSeenTour) {
      // Small delay to let the dashboard render
      const timer = setTimeout(() => {
        setRun(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleJoyrideCallback = (data: EventData) => {
    const { status, type, index } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('studioarella_tour_seen', 'true');
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        window.dispatchEvent(new Event('closeSidebar'));
      }
    }

    if (type === 'step:before') {
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        if (index === 1 || index === 2) {
          window.dispatchEvent(new Event('openSidebar'));
        } else {
          window.dispatchEvent(new Event('closeSidebar'));
        }
      }
    }
  };

  const steps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      content: (
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', color: theme.color.text1 }}>Welcome to Studio Arella! 👋</h3>
          <p style={{ fontSize: 14, color: theme.color.text3, margin: 0, lineHeight: 1.6 }}>
            Let's take a quick tour to help you navigate your new media dashboard.
          </p>
        </div>
      ),
      skipBeacon: true,
    },
    {
      target: '#tour-book-ad',
      content: (
        <div>
          <h4 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px', color: theme.color.text1 }}>Digital Screen Advertising</h4>
          <p style={{ fontSize: 13, color: theme.color.text3, margin: 0, lineHeight: 1.5 }}>
            Click here to book slots on our 10ft × 6ft LED screen at Bems Junction. High visibility for your brand!
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '#tour-book-podcast',
      content: (
        <div>
          <h4 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px', color: theme.color.text1 }}>Podcast Studio</h4>
          <p style={{ fontSize: 13, color: theme.color.text3, margin: 0, lineHeight: 1.5 }}>
            You can also book our premium, soundproofed podcast studio here for your audio and video recordings.
          </p>
        </div>
      ),
      placement: 'right',
    },
    {
      target: '#tour-stats',
      content: (
        <div>
          <h4 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px', color: theme.color.text1 }}>Performance Overview</h4>
          <p style={{ fontSize: 13, color: theme.color.text3, margin: 0, lineHeight: 1.5 }}>
            See a quick snapshot of your total spend, active campaigns, and booked slots.
          </p>
        </div>
      ),
    },
    {
      target: '#tour-chart',
      content: (
        <div>
          <h4 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px', color: theme.color.text1 }}>Live Impressions</h4>
          <p style={{ fontSize: 13, color: theme.color.text3, margin: 0, lineHeight: 1.5 }}>
            Track the hourly performance of your ads. When an ad runs, impressions will show up here.
          </p>
        </div>
      ),
    },
    {
      target: '#tour-balance',
      content: (
        <div>
          <h4 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px', color: theme.color.text1 }}>Wallet & Credits</h4>
          <p style={{ fontSize: 13, color: theme.color.text3, margin: 0, lineHeight: 1.5 }}>
            Fund your wallet seamlessly using Monnify to instantly pay for screen and studio bookings.
          </p>
        </div>
      ),
      placement: 'left',
    },
    {
      target: '#tour-actions',
      content: (
        <div>
          <h4 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px', color: theme.color.text1 }}>Quick Actions</h4>
          <p style={{ fontSize: 13, color: theme.color.text3, margin: 0, lineHeight: 1.5 }}>
            Need help creating an ad? You can quickly request our creative team to design or film for you right from here!
          </p>
        </div>
      ),
      placement: 'left',
    }
  ];

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      locale={{ skip: 'Skip Tour', last: 'Finish', next: 'Next', back: 'Back' }}
      onEvent={handleJoyrideCallback}
      options={{
        primaryColor: theme.color.gold,
        textColor: theme.color.text1,
        backgroundColor: theme.color.surface,
        arrowColor: theme.color.surface,
        overlayColor: 'rgba(15, 23, 42, 0.75)',
        zIndex: 10000,
        buttons: ['skip', 'back', 'close', 'primary'],
      }}
      styles={{
        tooltipContainer: {
          textAlign: 'left',
          fontFamily: theme.font.body,
        },
        buttonPrimary: {
          backgroundColor: theme.color.gold,
          color: theme.color.charcoal900,
          fontWeight: 800,
          borderRadius: 8,
          fontSize: 13,
          padding: '8px 16px',
        },
        buttonBack: {
          color: theme.color.text3,
          marginRight: 10,
        },
        buttonSkip: {
          color: theme.color.text3,
          fontSize: 13,
          fontWeight: 700,
          marginRight: 'auto',
          padding: '8px 12px',
        },
        tooltip: {
          borderRadius: 12,
          padding: 24,
          border: `1px solid ${theme.color.border}`,
          boxShadow: theme.shadow.lg,
        }
      }}
    />
  );
}
