import { KysoAnalyticsReportDownload, KysoAnalyticsReportShare, KysoAnalyticsReportView, KysoEventEnum, ReportAnalytics } from '@kyso-io/kyso-model'
import { Controller, Inject } from '@nestjs/common'
import { EventPattern } from '@nestjs/microservices'
import { Db } from 'mongodb'
import { Constants } from '../constants'

const MAX_LIMIT_ITEMS = 100

@Controller()
export class ReportsController {
    constructor(
        @Inject(Constants.DATABASE_CONNECTION)
        private db: Db,
    ) {}

    @EventPattern(KysoEventEnum.ANALYTICS_REPORT_VIEW)
    async handleReportView(kysoAnalyticsReportView: KysoAnalyticsReportView) {
        let reportAnalytics: ReportAnalytics = await this.db.collection<ReportAnalytics>(Constants.DATABASE_COLLECTION_REPORT_ANALYTICS).findOne({ reportId: kysoAnalyticsReportView.report_id })
        if (!reportAnalytics) {
            reportAnalytics = new ReportAnalytics(kysoAnalyticsReportView.report_id)
            reportAnalytics.created_at = new Date()
        }
        reportAnalytics.updated_at = new Date()
        // VIEWS
        reportAnalytics.views.last_items.unshift({
            timestamp: new Date(),
            user_id: kysoAnalyticsReportView.user_id,
            location: kysoAnalyticsReportView.location,
            device: kysoAnalyticsReportView.device,
        })
        if (reportAnalytics.views.last_items.length > MAX_LIMIT_ITEMS) {
            reportAnalytics.views.last_items.pop()
        }

        let country = null;
        if (kysoAnalyticsReportView.location) {
            // Extract the text between parentheses
            const regex = /\(([^)]+)\)/;
            const matches = regex.exec(kysoAnalyticsReportView.location);
            if (matches && matches.length > 1) {
                country = matches[1];
            }
        }
        const indexLocation: number = reportAnalytics.views.locations.findIndex((e) => e.location === country)
        if (indexLocation === -1) {
            reportAnalytics.views.locations.unshift({
                location: country,
                coords: kysoAnalyticsReportView.coords,
                count: 1,
            })
        } else {
            reportAnalytics.views.locations[indexLocation].count++
        }
        if (reportAnalytics.views.locations.length > MAX_LIMIT_ITEMS) {
            reportAnalytics.views.locations.pop()
        }
        if (kysoAnalyticsReportView.device) {
            if (kysoAnalyticsReportView.device.device?.type) {
                if (!reportAnalytics.views.devices[kysoAnalyticsReportView.device.device.type]) {
                    reportAnalytics.views.devices[kysoAnalyticsReportView.device.device.type] = 0
                }
                reportAnalytics.views.devices[kysoAnalyticsReportView.device.device.type]++
            }
            if (kysoAnalyticsReportView.device.os?.name) {
                if (!reportAnalytics.views.os[kysoAnalyticsReportView.device.os.name]) {
                    reportAnalytics.views.os[kysoAnalyticsReportView.device.os.name] = 0
                }
                reportAnalytics.views.os[kysoAnalyticsReportView.device.os.name]++
            }
            if (kysoAnalyticsReportView.device.client?.family) {
                if (!reportAnalytics.views.client[kysoAnalyticsReportView.device.client.family]) {
                    reportAnalytics.views.client[kysoAnalyticsReportView.device.client.family] = 0
                }
                reportAnalytics.views.client[kysoAnalyticsReportView.device.client.family]++
            }
        }
        await this.db
            .collection<ReportAnalytics>(Constants.DATABASE_COLLECTION_REPORT_ANALYTICS)
            .updateOne({ reportId: kysoAnalyticsReportView.report_id }, { $set: { ...reportAnalytics } }, { upsert: true })
    }

    @EventPattern(KysoEventEnum.ANALYTICS_REPORT_DOWNLOAD)
    async handleReportDownload(kysoAnalyticsReportDownload: KysoAnalyticsReportDownload) {
        let reportAnalytics: ReportAnalytics = await this.db.collection<ReportAnalytics>(Constants.DATABASE_COLLECTION_REPORT_ANALYTICS).findOne({ reportId: kysoAnalyticsReportDownload.report_id })
        if (!reportAnalytics) {
            reportAnalytics = new ReportAnalytics(kysoAnalyticsReportDownload.report_id)
            reportAnalytics.created_at = new Date()
        }
        reportAnalytics.updated_at = new Date()
        // DOWNLOADS
        reportAnalytics.downloads.count++
        reportAnalytics.downloads.last_items.unshift({
            timestamp: new Date(),
            user_id: kysoAnalyticsReportDownload.user_id,
            source: kysoAnalyticsReportDownload.source,
        })
        if (reportAnalytics.downloads.last_items.length > MAX_LIMIT_ITEMS) {
            reportAnalytics.downloads.last_items.pop()
        }
        if (!reportAnalytics.downloads.sources[kysoAnalyticsReportDownload.source]) {
            reportAnalytics.downloads.sources[kysoAnalyticsReportDownload.source] = 0
        }
        reportAnalytics.downloads.sources[kysoAnalyticsReportDownload.source]++
        await this.db
            .collection<ReportAnalytics>(Constants.DATABASE_COLLECTION_REPORT_ANALYTICS)
            .updateOne({ reportId: kysoAnalyticsReportDownload.report_id }, { $set: { ...reportAnalytics } }, { upsert: true })
    }

    @EventPattern(KysoEventEnum.ANALYTICS_REPORT_SHARE)
    async handleReportShare(kysoAnalyticsReportShare: KysoAnalyticsReportShare) {
        let reportAnalytics: ReportAnalytics = await this.db.collection<ReportAnalytics>(Constants.DATABASE_COLLECTION_REPORT_ANALYTICS).findOne({ reportId: kysoAnalyticsReportShare.report_id })
        if (!reportAnalytics) {
            reportAnalytics = new ReportAnalytics(kysoAnalyticsReportShare.report_id)
            reportAnalytics.created_at = new Date()
        }
        reportAnalytics.updated_at = new Date()
        // DOWNLOADS
        reportAnalytics.shares.count++
        reportAnalytics.shares.last_items.unshift({
            timestamp: new Date(),
            user_id: kysoAnalyticsReportShare.user_id,
        })
        if (reportAnalytics.shares.last_items.length > MAX_LIMIT_ITEMS) {
            reportAnalytics.shares.last_items.pop()
        }
        await this.db
            .collection<ReportAnalytics>(Constants.DATABASE_COLLECTION_REPORT_ANALYTICS)
            .updateOne({ reportId: kysoAnalyticsReportShare.report_id }, { $set: { ...reportAnalytics } }, { upsert: true })
    }
}
