import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, Star } from "lucide-react"

interface BookReviewCardProps {
  title: string
  author: string
  grade?: string 
  sensuality?: string
  bookTypes?: string[]
  asin?: string
  reviewUrl?: string
  featuredImage?: string
}

export default function BookReviewCard({
  title,
  author,
  grade,
  sensuality,
  bookTypes = [],
  asin,
  reviewUrl,
  featuredImage
}: BookReviewCardProps) {
  return (
    <Card className="w-full bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex gap-4">
          {/* Book Cover */}
          {featuredImage && (
            <div className="flex-shrink-0">
              <img 
                src={featuredImage} 
                alt={`Cover of ${title}`} 
                className="w-24 h-36 object-cover rounded-md shadow-sm border border-border/50"
                style={{ aspectRatio: '2/3' }}
              />
            </div>
          )}
          
          {/* Title and Author */}
          <div className="flex-1 min-w-0">
            <CardTitle className="font-serif text-xl leading-tight mb-1">{title}</CardTitle>
            <p className="text-muted-foreground text-sm">by {author}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 pt-0">
        <div className="flex flex-wrap gap-2">
          {grade && (
            <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">
              <Star className="w-3 h-3 mr-1 fill-primary" />
              Grade: {grade}
            </Badge>
          )}
          {sensuality && (
            <Badge variant="secondary" className="bg-secondary/50">
              {sensuality}
            </Badge>
          )}
          {bookTypes.map((type) => (
            <Badge key={type} variant="outline" className="border-primary/20">
              {type}
            </Badge>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {asin && (
            <Button 
              variant="default"
              size="sm"
              className="gap-2"
              asChild
            >
              <a
                href={`https://www.amazon.com/gp/product/${asin}/ref=as_li_tl?ie=UTF8&camp=1789&creative=9325&creativeASIN=${asin}&linkCode=as2&tag=allaboutromance`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Buy on Amazon
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          )}
          {reviewUrl && (
            <Button 
              variant="secondary"
              size="sm"
              className="gap-2"
              asChild
            >
              <a
                href={reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read Review
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}