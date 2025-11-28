// Notification Service for Browser Notifications
class NotificationService {
    async requestPermission(): Promise<boolean> {
        if (!("Notification" in window)) {
            console.warn("Este navegador no soporta notificaciones");
            return false;
        }

        if (Notification.permission === "granted") {
            return true;
        }

        if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            return permission === "granted";
        }

        return false;
    }

    async sendNotification(title: string, options?: NotificationOptions) {
        if (!("Notification" in window)) return;

        if (Notification.permission !== "granted") {
            const granted = await this.requestPermission();
            if (!granted) return;
        }

        new Notification(title, {
            icon: 'https://placehold.co/100x100/4f46e5/ffffff?text=A',
            badge: 'https://placehold.co/50x50/4f46e5/ffffff?text=!',
            ...options
        });
    }

    parseDate(dateStr: string): Date {
        // Expected format: DD/MM/YYYY
        const [day, month, year] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day);
    }

    daysBetween(date1: Date, date2: Date): number {
        const msPerDay = 24 * 60 * 60 * 1000;
        return Math.round((date2.getTime() - date1.getTime()) / msPerDay);
    }

    checkUpcomingRenewals(contracts: any[], threshold: number = 30): any[] {
        const today = new Date();
        const upcomingRenewals: any[] = [];

        contracts.forEach(contract => {
            if (contract.status !== 'active') return;

            const renewalDate = this.parseDate(contract.nextRenewalDate);
            const daysUntil = this.daysBetween(today, renewalDate);

            if (daysUntil <= threshold && daysUntil >= 0) {
                upcomingRenewals.push({
                    ...contract,
                    daysUntil
                });
            }
        });

        return upcomingRenewals.sort((a, b) => a.daysUntil - b.daysUntil);
    }

    async notifyUpcomingRenewals(contracts: any[], threshold: number = 30) {
        const upcoming = this.checkUpcomingRenewals(contracts, threshold);

        for (const contract of upcoming) {
            // Only notify if very close (7 days or less) to avoid spam
            if (contract.daysUntil <= 7) {
                await this.sendNotification(
                    `Renovación próxima: ${contract.clientName}`,
                    {
                        body: `${contract.serviceName} (${contract.provider}) vence en ${contract.daysUntil} día(s)\nMonto: $${contract.amount.toFixed(2)}`,
                        tag: contract.id,
                        requireInteraction: contract.daysUntil <= 3
                    }
                );
            }
        }
    }
}

export const notificationService = new NotificationService();
