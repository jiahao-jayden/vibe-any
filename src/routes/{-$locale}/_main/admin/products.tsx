import { createFileRoute } from "@tanstack/react-router"
import { useIntlayer } from "react-intlayer"
import { PageHeader } from "@/shared/components/admin"

export const Route = createFileRoute("/{-$locale}/_main/admin/products")({
  component: ProductsPage,
})

function ProductsPage() {
  const content = useIntlayer("admin")

  return (
    <>
      <PageHeader
        title={content.products.title.value}
        description={content.products.description.value}
      />
      <div>Products page content</div>
    </>
  )
}
