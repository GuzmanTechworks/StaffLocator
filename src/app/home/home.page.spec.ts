import { HomePage } from './home.page';

describe('HomePage logout', () => {
  let component: HomePage;
  let staffLocator: { session: unknown };
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    staffLocator = { session: { accessToken: 'session-token' } };
    router = { navigateByUrl: vi.fn().mockResolvedValue(true) };
    component = new HomePage(
      staffLocator as any,
      { markForCheck: () => undefined } as any,
      router as any,
    );
  });

  it('clears the local session only when logging out', () => {
    component.logout();

    expect(staffLocator.session).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/sign-in');
  });
});
