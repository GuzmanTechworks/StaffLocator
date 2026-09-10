import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { BiometricAuth, BiometryError, BiometryErrorType } from '@aparajita/capacitor-biometric-auth';
import { StaffLocatorService } from '../core/staff-locator.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.page.html',
  styleUrls: ['./sign-in.page.scss'],
  standalone: false,
})
export class SignInPage implements OnInit {
  username = '';
  password = '';
  error = '';
  isSubmitting = false;
  useFingerprint = false;
  biometricAvailable = false;
  biometricBusy = false;

  get session() {
    return this.staffLocator.session;
  }

  get canUseFingerprint() {
    return this.biometricAvailable && this.staffLocator.biometricEnabled && !!this.session;
  }

  constructor(
    private readonly staffLocator: StaffLocatorService,
    private readonly router: Router,
    private readonly alertController: AlertController,
  ) {}

  ngOnInit() {
    this.useFingerprint = this.staffLocator.biometricEnabled;
    void this.checkBiometricAvailability();
  }

  async submit() {
    this.isSubmitting = true;
    this.error = '';

    this.staffLocator.login(this.username, this.password).subscribe({
      next: async (session) => {
        this.staffLocator.session = session;

        if (this.biometricAvailable && !this.staffLocator.biometricEnabled) {
          this.useFingerprint = await this.promptUseFingerprint();
          this.staffLocator.biometricEnabled = this.useFingerprint;
        }

        this.isSubmitting = false;
        await this.router.navigateByUrl('/home');
      },
      error: (response) => {
        this.error = response.error?.message ?? 'Invalid username or password.';
        this.isSubmitting = false;
      },
    });
  }

  async useFingerprintSignIn() {
    if (!this.staffLocator.session || !this.staffLocator.biometricEnabled) {
      return;
    }

    this.biometricBusy = true;
    this.error = '';

    try {
      const bioInfo = await BiometricAuth.checkBiometry();
      if (!bioInfo.isAvailable) {
        this.error = 'Fingerprint authentication is not available on this device.';
        return;
      }

      await BiometricAuth.authenticate({
        reason: 'Authenticate to open Staff Locator',
        cancelTitle: 'Cancel',
        iosFallbackTitle: 'Use passcode',
        androidTitle: 'Biometric sign in',
        androidSubtitle: 'Use your saved fingerprint or device credential',
        allowDeviceCredential: true,
      });

      this.router.navigateByUrl('/home');
    } catch (error) {
      if (error instanceof BiometryError && error.code !== BiometryErrorType.userCancel) {
        this.error = error.message || 'Unable to authenticate with fingerprint.';
      }
    } finally {
      this.biometricBusy = false;
    }
  }

  private async checkBiometricAvailability() {
    try {
      const bioInfo = await BiometricAuth.checkBiometry();
      this.biometricAvailable = bioInfo.isAvailable;
    } catch {
      this.biometricAvailable = false;
    }
  }

  private async promptUseFingerprint(): Promise<boolean> {
    const alert = await this.alertController.create({
      header: 'Use fingerprint?',
      message: 'Would you like to use your phone fingerprint for future logins?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
        },
        {
          text: 'Yes',
          handler: () => true,
        },
      ],
    });

    await alert.present();
    const result = await alert.onDidDismiss();

    return result.role !== 'cancel' && result.role !== 'backdrop';
  }
}