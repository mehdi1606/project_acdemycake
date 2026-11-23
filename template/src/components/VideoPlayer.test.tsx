import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import VideoPlayer from './VideoPlayer';

// Mock the native 'canvas' module if jsdom attempts to load it under a mismatched Node ABI
jest.mock('canvas', () => ({}), { virtual: true });

// Mock video.js so we can inspect the options and DOM attributes in a unit test environment
const mockOn = jest.fn();
const mockOne = jest.fn();
const mockReady = jest.fn((cb: () => void) => cb());
const mockDispose = jest.fn();
const mockIsDisposed = jest.fn(() => false);
const mockSrc = jest.fn();
const mockPoster = jest.fn();

const mockVideoJsInstance = {
  on: mockOn,
  one: mockOne,
  ready: mockReady,
  dispose: mockDispose,
  isDisposed: mockIsDisposed,
  src: mockSrc,
  poster: mockPoster,
  currentTime: jest.fn(() => 42),
  duration: jest.fn(() => 600),
  error: jest.fn(() => null),
  play: jest.fn(() => Promise.resolve()),
};

const mockVideoJs = jest.fn((el: HTMLElement, _opts: any) => {
  // Simulate Video.js creating the inner <video> element inside the <video-js> host
  if (!el.querySelector('video')) {
    const innerVideo = document.createElement('video');
    el.appendChild(innerVideo);
  }
  return mockVideoJsInstance;
});
(mockVideoJs as any).browser = { IS_SAFARI: false };

jest.mock('video.js', () => ({
  __esModule: true,
  default: (el: HTMLElement, opts: any) => mockVideoJs(el, opts),
}));

describe('VideoPlayer anti-download and streaming security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders fallback message when src is null', () => {
    const { getByText } = render(<VideoPlayer src={null} />);
    expect(getByText('Video not available')).toBeInTheDocument();
  });

  test('configures Video.js with nodownload, disables PictureInPicture and remote playback, and preserves fullscreen & playbackRates', () => {
    const { container } = render(
      <VideoPlayer
        src="https://www.saralowe.ma/api/v1/videos/123/stream?token=abc"
        title="Tempering Chocolate"
      />
    );

    expect(mockVideoJs).toHaveBeenCalledTimes(1);
    const [, options] = mockVideoJs.mock.calls[0];

    // Verify playback speeds and fullscreen are preserved while PiP toggle is disabled
    expect(options.playbackRates).toEqual([0.5, 0.75, 1, 1.25, 1.5, 2]);
    expect(options.controlBar).toEqual({
      pictureInPictureToggle: false,
      fullscreenToggle: true,
    });
    expect(options.html5.nativeVideoAttributes).toEqual({
      controlsList: 'nodownload',
      disablePictureInPicture: true,
      disableRemotePlayback: true,
    });

    // Verify the underlying native <video> element has anti-download attributes applied
    const nativeVideo = container.querySelector('video') as HTMLVideoElement;
    expect(nativeVideo).not.toBeNull();
    expect(nativeVideo.getAttribute('controlsList')).toBe('nodownload');
    expect(nativeVideo.getAttribute('disablePictureInPicture')).toBe('true');
    expect(nativeVideo.getAttribute('disableRemotePlayback')).toBe('true');
    expect(nativeVideo.draggable).toBe(false);

    // Verify right-click context menu and dragStart are prevented on the player container
    const wrapper = container.querySelector('[data-vjs-player]') as HTMLElement;
    expect(wrapper).not.toBeNull();

    const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    wrapper.dispatchEvent(contextMenuEvent);
    expect(contextMenuEvent.defaultPrevented).toBe(true);

    const dragStartEvent = new Event('dragstart', { bubbles: true, cancelable: true });
    wrapper.dispatchEvent(dragStartEvent);
    expect(dragStartEvent.defaultPrevented).toBe(true);
  });

  test('invokes onError callback with last known playback position when streaming token expires', () => {
    const handleError = jest.fn();
    render(
      <VideoPlayer
        src="https://www.saralowe.ma/api/v1/videos/123/stream?token=expired"
        startAt={95}
        onError={handleError}
      />
    );

    // Find the registered 'error' listener and trigger it
    const errorCall = mockOn.mock.calls.find(([event]) => event === 'error');
    expect(errorCall).toBeDefined();
    const errorHandler = errorCall![1];
    errorHandler();

    expect(handleError).toHaveBeenCalledWith(95, false);
  });
});
