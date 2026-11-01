
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.body?.refresh_token;

    if (
      typeof refreshToken !== 'string' ||
      !refreshToken.trim()
    ) {
      return sendError(
        res,
        401,
        'NO_REFRESH_TOKEN',
        'Refresh token is required'
      );
    }

    const client = createSupabaseClient();

    const { data, error } = await client.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session || !data.user) {
      return sendError(
        res,
        401,
        'INVALID_REFRESH_TOKEN',
        'Session expired. Please log in again.'
      );
    }

    const profile = await getProfile(
      data.session.access_token,
      data.user.id
    );

    if (!profile) {
      return sendError(
        res,
        404,
        'PROFILE_NOT_FOUND',
        'User profile not found'
      );
    }

    if (profile.is_active === false) {
      return sendError(
        res,
        403,
        'ACCOUNT_DISABLED',
        'Your account has been deactivated'
      );
    }

    return res.json({
      success: true,
      data: {
        session: data.session,
        user: profile,
      },
    });

  } catch (error: any) {
    console.error('[Refresh Error]:', error.message);

    return sendError(
      res,
      500,
      'REFRESH_ERROR',
      'Unable to refresh session'
    );
  }
});
