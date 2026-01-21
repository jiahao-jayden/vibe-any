import { render } from "@react-email/components"
import nodemailer from "nodemailer"
import React from "react"
import { Resend } from "resend"
import { MagicLinkEmail } from "@/shared/components/email/magic-link-email"
import { VerificationEmail } from "@/shared/components/email/verification-email"

export type EmailType = "magic-link" | "verification"

export interface EmailData {
  to: string
  url: string
  locale?: string
  subject: string
  type?: EmailType
}

interface EmailSendData extends EmailData {
  from: string
}

export interface EmailStrategy {
  sendEmail(data: EmailSendData, emailHtml: string): Promise<void>
}

export class ResendEmailStrategy implements EmailStrategy {
  private resend: Resend

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey)
  }

  async sendEmail(data: EmailSendData, emailHtml: string): Promise<void> {
    await this.resend.emails.send({
      from: data.from,
      to: data.to,
      subject: data.subject,
      html: emailHtml,
    })
  }
}

export class NodemailerEmailStrategy implements EmailStrategy {
  private transporter: nodemailer.Transporter

  constructor(config: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }) {
    this.transporter = nodemailer.createTransport(config)
  }

  async sendEmail(data: EmailSendData, emailHtml: string): Promise<void> {
    await this.transporter.sendMail({
      from: data.from,
      to: data.to,
      subject: data.subject,
      html: emailHtml,
    })
  }
}

function renderEmailTemplate(data: EmailData): Promise<string> {
  const type = data.type || "magic-link"

  if (type === "verification") {
    return render(
      React.createElement(VerificationEmail, {
        verificationLink: data.url,
        locale: data.locale || "en",
      })
    )
  }

  return render(
    React.createElement(MagicLinkEmail, {
      magicLink: data.url,
      locale: data.locale || "en",
    })
  )
}

export class EmailContext {
  private strategy: EmailStrategy

  constructor(strategy: EmailStrategy) {
    this.strategy = strategy
  }

  setStrategy(strategy: EmailStrategy): void {
    this.strategy = strategy
  }

  async sendEmail(data: EmailData): Promise<void> {
    const from = process.env.EMAIL_FROM
    if (!from) {
      throw new Error("EMAIL_FROM environment variable is not set")
    }

    const emailHtml = await renderEmailTemplate(data)
    await this.strategy.sendEmail({ ...data, from }, emailHtml)
  }
}

export function createEmailContext(): EmailContext {
  let strategy: EmailStrategy

  if (process.env.EMAIL_PROVIDER === "resend") {
    strategy = new ResendEmailStrategy(process.env.RESEND_API_KEY!)
  } else if (process.env.EMAIL_PROVIDER === "custom") {
    strategy = new NodemailerEmailStrategy({
      host: process.env.EMAIL_HOST as string,
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER as string,
        pass: process.env.EMAIL_PASSWORD as string,
      },
    })
  } else {
    throw new Error(`Unsupported email provider: ${process.env.EMAIL_PROVIDER}`)
  }

  return new EmailContext(strategy)
}

export const sendEmail = async (data: EmailData): Promise<void> => {
  const emailContext = createEmailContext()
  await emailContext.sendEmail(data)
}
