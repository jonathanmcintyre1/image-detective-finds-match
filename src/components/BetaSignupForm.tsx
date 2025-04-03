
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

// Create schema for form validation
const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  name: z.string().optional(),
  company: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface BetaSignupFormProps {
  onSuccess?: () => void;
  embedded?: boolean;
}

const BetaSignupForm = ({ onSuccess, embedded = false }: BetaSignupFormProps) => {
  const [loading, setLoading] = useState(false);

  // Initialize form with Zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      phone: '',
      name: '',
      company: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);
      
      // Check if email already exists
      const { count } = await supabase
        .from('prelaunch_signups')
        .select('*', { count: 'exact', head: true })
        .eq('email', data.email);
      
      if (count && count > 0) {
        toast.info("You're already on our beta list!", {
          description: "Thanks for your continued interest!"
        });
        setLoading(false);
        form.reset();
        
        // Call onSuccess even if already signed up
        if (onSuccess) {
          onSuccess();
        }
        
        return;
      }
      
      // Collect additional user information
      const userAgent = navigator.userAgent;
      const browserInfo = {
        userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
      };
      
      // Add email and additional info to the beta signup list
      const { error } = await supabase
        .from('prelaunch_signups')
        .insert({
          email: data.email,
          phone: data.phone || null,
          name: data.name || null,
          company: data.company || null,
          browser_info: browserInfo,
          signup_page: window.location.pathname,
          referrer: document.referrer || null,
        });
      
      if (error) {
        throw error;
      }
      
      toast.success("Successfully signed up for beta access!", {
        description: "We'll notify you when CopyProtect launches."
      });
      
      // Reset form
      form.reset();
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error("Error signing up for beta:", error);
      toast.error("Failed to sign up", {
        description: "Please try again later."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 shadow-sm max-w-md w-full border">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-card-foreground">
          Get Early Access
        </h2>
        <p className="text-base mt-2 text-muted-foreground">
          Sign up for beta access to CopyProtect when we launch
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">
                  Email address *
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="youremail@example.com" 
                    type="email"
                    disabled={loading}
                    required
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">
                  Full name (optional)
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="John Smith" 
                    type="text"
                    disabled={loading}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">
                  Company (optional)
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Your Company, Inc." 
                    type="text"
                    disabled={loading}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">
                  Phone number (optional)
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="+1 (555) 123-4567" 
                    type="tel"
                    disabled={loading}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full mt-2"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Processing...
              </span>
            ) : (
              'Join the Beta'
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground pt-2">
            We respect your privacy and won't share your information with third parties.
          </p>
        </form>
      </Form>
    </div>
  );
};

export default BetaSignupForm;
