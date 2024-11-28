import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ExternalLink, Star, BookOpen, ThermometerSun } from 'lucide-react'
import { motion } from 'framer-motion'

interface BookReviewCardProps {
  title: string
  author: string
  grade?: string 
  sensuality?: string
  bookTypes?: string[]
  asin?: string
  reviewUrl?: string
  postId?: string
  featuredImage?: string
}

const gradeColors = {
  'A+': 'bg-emerald-500',
  'A': 'bg-emerald-400',
  'A-': 'bg-emerald-300',
  'B+': 'bg-blue-500',
  'B': 'bg-blue-400',
  'B-': 'bg-blue-300',
  'C+': 'bg-yellow-500',
  'C': 'bg-yellow-400',
  'C-': 'bg-yellow-300',
  'D+': 'bg-orange-500',
  'D': 'bg-orange-400',
  'D-': 'bg-orange-300',
  'F': 'bg-red-500'
} as const

const sensualityColors = {
  'Burning': 'bg-red-500/20 text-red-200',
  'Hot': 'bg-orange-500/20 text-orange-200',
  'Warm': 'bg-yellow-500/20 text-yellow-200',
  'Subtle': 'bg-blue-500/20 text-blue-200',
  'Kisses': 'bg-pink-500/20 text-pink-200',
  'None': 'bg-gray-500/20 text-gray-200',
} as const

export default function BookReviewCard({
  title,
  author,
  grade,
  sensuality,
  bookTypes = [],
  asin,
  reviewUrl,
  postId,
  featuredImage
}: BookReviewCardProps) {
  const gradeKey = grade as keyof typeof gradeColors
  const sensualityKey = sensuality as keyof typeof sensualityColors

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full bg-white/10 backdrop-blur border-white/20">
        <CardHeader className="pb-3">
          <div className="flex gap-4">
            {featuredImage ? (
              <div className="flex-shrink-0">
                <img 
                  src={featuredImage} 
                  alt={`Cover of ${title}`} 
                  className="w-24 h-36 object-cover rounded-md shadow-sm border border-white/20"
                  style={{ aspectRatio: '2/3' }}
                />
              </div>
            ) : (
              <div className="flex-shrink-0 w-24 h-36 bg-white/5 rounded-md flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-white/50" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-xl leading-tight mb-1 text-white">{title}</h3>
              <p className="text-white/80 text-sm">by {author}</p>

              <div className="flex flex-wrap gap-2 mt-2">
                {grade && (
                  <Badge 
                    className={`${gradeColors[gradeKey] || 'bg-[#7f85c2]/50'} text-white`}
                  >
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Grade: {grade}
                  </Badge>
                )}
                
                {sensuality && (
                  <Badge 
                    variant="secondary" 
                    className={sensualityColors[sensualityKey] || 'bg-white/10 text-white'}
                  >
                    <ThermometerSun className="w-3 h-3 mr-1" />
                    {sensuality}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 pt-0">
          {bookTypes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {bookTypes.map((type) => (
                <Badge 
                  key={type} 
                  variant="outline" 
                  className="border-white/20 text-sm text-white"
                >
                  {type}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {asin && (
              <Button 
                variant="default"
                size="sm"
                className="gap-2 bg-[#7f85c2] text-white hover:bg-[#5a5f8f]"
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
                className="gap-2 bg-white/10 text-white hover:bg-white/20"
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
            
            {postId && !reviewUrl && (
              <Button 
                variant="secondary"
                size="sm"
                className="gap-2 bg-white/10 text-white hover:bg-white/20"
                asChild
              >
                <a
                  href={`https://web.archive.org/web/*/https://allaboutromance.com/?p=${postId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Archived Review
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}