import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Users, Calendar, Share2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AiMealBudgetPlanner = () => {
  const [weeklyBudget, setWeeklyBudget] = useState<number | "">(700);
  const [familySize, setFamilySize] = useState<number | "">(4);
  const [showPlan, setShowPlan] = useState(false);
  const { toast } = useToast();

  const generatePlan = () => {
    setShowPlan(true);
    toast({
      title: "Budget plan generated!",
      description: `Weekly budget plan for ₹${budgetValue} for ${familySizeValue} people`
    });
  };

  const budgetValue = typeof weeklyBudget === "number" ? weeklyBudget : 0;
  const familySizeValue = typeof familySize === "number" ? familySize : 0;
  const dailyBudget = budgetValue / 7;
  const perPersonDaily = dailyBudget / familySizeValue;

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const exportPlan = () => {
    const text = `Weekly Budget Plan\nTotal Budget: ₹${budgetValue}\nFamily Members: ${familySizeValue}\nDaily Budget: ₹${dailyBudget.toFixed(0)}\nPer Person Daily: ₹${perPersonDaily.toFixed(0)}`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'budget-plan.txt'; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported!", description: "Budget plan downloaded." });
  };

  const sharePlan = async () => {
    const text = `Weekly Budget Plan\nTotal: ₹${budgetValue} for ${familySizeValue} people\nDaily: ₹${dailyBudget.toFixed(0)}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Budget Plan', text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied!", description: "Plan copied to clipboard." });
    }
  };

  return (
    <div className="bg-white">
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-8 text-gray-900">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-green-600" />
          <h1 className="text-3xl font-bold mb-2">Meal Budget Planner</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Plan your weekly meals within budget
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="bg-gradient-to-br from-white to-gray-50 shadow-xl border-2 hover:border-primary">
            <CardHeader>
              <CardTitle>Budget & Family Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Weekly Budget (₹)</label>
                  <Input
                    type="number"
                    value={weeklyBudget}
                    onChange={(e) => setWeeklyBudget(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Enter weekly budget"
                  />
                  <p className="text-sm text-muted-foreground">
                    Daily budget: ₹{dailyBudget.toFixed(0)} per person
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Family Members</label>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <Input
                      type="number"
                      value={familySize}
                      onChange={(e) => setFamilySize(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="Number of people"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
              </div>
              <Button 
                onClick={generatePlan} 
                className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:from-green-600 hover:to-blue-600"
                size="lg"
              >
                Generate Weekly Plan
              </Button>
            </CardContent>
          </Card>

          {showPlan && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-white to-gray-50 shadow-lg border-2 hover:border-primary">
                  <CardContent className="p-6 text-center">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">₹{budgetValue}</div>
                    <div className="text-sm text-muted-foreground">Total Weekly Budget</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-white to-gray-50 shadow-lg border-2 hover:border-primary">
                  <CardContent className="p-6 text-center">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold">₹{dailyBudget.toFixed(0)}</div>
                    <div className="text-sm text-muted-foreground">Daily Budget</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-white to-gray-50 shadow-lg border-2 hover:border-primary">
                  <CardContent className="p-6 text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold">₹{perPersonDaily.toFixed(0)}</div>
                    <div className="text-sm text-muted-foreground">Per Person Daily</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gradient-to-br from-white to-gray-50 shadow-lg border-2 hover:border-primary">
                <CardHeader>
                  <CardTitle>Weekly Budget Division</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {days.map((day, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                        <span className="font-medium">{day}</span>
                        <Badge variant="secondary">
                          ₹{dailyBudget.toFixed(0)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 justify-end mt-6">
                    <Button variant="outline" size="sm" onClick={sharePlan}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportPlan}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiMealBudgetPlanner;