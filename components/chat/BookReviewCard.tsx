import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Star, ThermometerSun, Tag, ExternalLink } from 'lucide-react'
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
  reviewTags?: string[]
}

// Grade color mapping with tailwind classes
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
} as const;

// Sensuality rating color mapping
const sensualityColors = {
  'Burning': 'bg-red-500/20 text-red-200',
  'Hot': 'bg-orange-500/20 text-orange-200',
  'Warm': 'bg-yellow-500/20 text-yellow-200',
  'Subtle': 'bg-blue-500/20 text-blue-200',
  'Kisses': 'bg-pink-500/20 text-pink-200',
  'None': 'bg-gray-500/20 text-gray-200',
} as const;

export default function BookReviewCard({
  title,
  author,
  grade,
  sensuality,
  bookTypes = [],
  asin,
  reviewUrl,
  postId,
  featuredImage,
  reviewTags = []
}: BookReviewCardProps) {
  const gradeKey = grade as keyof typeof gradeColors;
  const sensualityKey = sensuality as keyof typeof sensualityColors;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ 
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      <Card className="overflow-hidden bg-white/10 backdrop-blur border-white/20 transition-all hover:shadow-lg hover:bg-white/15">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Book Cover Section */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex-shrink-0"
            >
              {featuredImage ? (
                <div className="relative w-24 h-36 overflow-hidden rounded-lg shadow-md">
                  <img 
                    src={featuredImage} 
                    alt={`Cover of ${title}`} 
                    className="object-cover w-full h-full transition-transform duration-300 hover:scale-110"
                  />
                </div>
              ) : (
                <div className="w-24 h-36 bg-white/5 rounded-lg flex items-center justify-center shadow-md">
                  <BookOpen className="w-8 h-8 text-white/50" />
                </div>
              )}
            </motion.div>
            
            {/* Book Details Section */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Title and Author */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="font-serif text-xl leading-tight text-white line-clamp-2 mb-1">{title}</h3>
                <p className="text-white/80 text-sm">by {author}</p>
              </motion.div>

              {/* Grades and Ratings */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-2"
              >
                {grade && (
                  <Badge 
                    className={`${gradeColors[gradeKey] || 'bg-[#7f85c2]/50'} text-white font-medium transition-colors`}
                  >
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    {grade}
                  </Badge>
                )}
                
                {sensuality && (
                  <Badge 
                    variant="secondary" 
                    className={`${sensualityColors[sensualityKey] || 'bg-white/10 text-white'} transition-colors`}
                  >
                    <ThermometerSun className="w-3 h-3 mr-1" />
                    {sensuality}
                  </Badge>
                )}
              </motion.div>

              {/* Book Types and Tags */}
              {(bookTypes.length > 0 || reviewTags.length > 0) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-wrap gap-2"
                >
                  {bookTypes.map((type) => (
                    <Badge 
                      key={type} 
                      variant="outline" 
                      className="border-white/20 text-xs text-white/90 bg-white/5"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {type}
                    </Badge>
                  ))}
                  {reviewTags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="outline" 
                      className="border-white/20 text-xs text-white/80 bg-white/5"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </motion.div>
              )}
              
              {/* Action Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap gap-2 pt-1"
              >
                {/* Amazon Buy Button */}
                {asin && (
                  <Button 
                    variant="default"
                    size="sm"
                    className="gap-2 bg-[#7f85c2] text-white hover:bg-[#5a5f8f] transition-colors"
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
                
                {/* Read Review Button */}
                {postId && (
                  <Button 
                    variant="secondary"
                    size="sm"
                    className="gap-2 bg-white/10 text-white hover:bg-white/20 transition-colors"
                    asChild
                  >
                    <a
                      href={`https://allaboutromance.com/?p=${postId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Read Review
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                )}
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}